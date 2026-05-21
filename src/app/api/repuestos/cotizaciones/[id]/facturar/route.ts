import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { generarNumeroFactura } from '@/lib/facturacion';
import { z } from 'zod';

const INDUSTRIAS_REPUESTOS = ['REPUESTOS'];

const facturarSchema = z.object({
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO']),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_REPUESTOS.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para Repuestos.', 403);

    const { id } = await params;

    const cotizacion = await prisma.cotizacion.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
      include: { items: true },
    });
    if (!cotizacion) return err('NOT_FOUND', 'Cotización no encontrada.', 404);
    if (cotizacion.estado === 'RECHAZADA')
      return err('VALIDATION_ERROR', 'No se puede facturar una cotización rechazada.', 422);
    if (cotizacion.facturaId)
      return err('CONFLICT', 'Esta cotización ya fue facturada.', 409);
    if (cotizacion.items.length === 0)
      return err('VALIDATION_ERROR', 'La cotización no tiene ítems.', 422);

    const body = await req.json();
    const parsed = facturarSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const factura = await prisma.$transaction(async (tx) => {
      const { numero, numeroInt, anio } = await generarNumeroFactura(
        sesion.empresaActivaId,
        tx as never,
      );

      const nuevaFactura = await tx.factura.create({
        data: {
          empresaId: sesion.empresaActivaId,
          numero,
          numeroInt,
          anio,
          clienteId: cotizacion.clienteId,
          clienteNombre: cotizacion.clienteNombre,
          metodoPago: parsed.data.metodoPago,
          estado: parsed.data.metodoPago === 'CREDITO' ? 'EMITIDA' : 'PAGADA',
          subtotal: cotizacion.subtotal,
          itbis: cotizacion.itbis,
          descuento: 0,
          total: cotizacion.total,
          saldo: parsed.data.metodoPago === 'CREDITO' ? cotizacion.total : 0,
          creadoPor: sesion.usuarioId,
          items: {
            create: cotizacion.items.map((item) => ({
              productoNombre: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              itbisPorcentaje: item.itbisPorcentaje,
              itbisMonto: item.itbisMonto,
              descuento: 0,
              subtotal: item.subtotal,
              total: item.total,
            })),
          },
        },
      });

      await tx.cotizacion.update({
        where: { id },
        data: { facturaId: nuevaFactura.id, estado: 'FACTURADA' },
      });

      return nuevaFactura;
    });

    return ok(factura);
  } catch (error) {
    return handleApiError(error, 'POST /api/repuestos/cotizaciones/[id]/facturar');
  }
}
