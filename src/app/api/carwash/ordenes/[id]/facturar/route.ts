import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { generarNumeroFactura } from '@/lib/facturacion';
import { z } from 'zod';

const INDUSTRIAS_CARWASH = ['CARWASH'];

const facturarSchema = z.object({
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO']),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_CARWASH.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para Carwash.', 403);

    const { id } = await params;

    const orden = await prisma.ordenCarwash.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!orden) return err('NOT_FOUND', 'Orden no encontrada.', 404);
    if (orden.estado !== 'LISTO')
      return err('VALIDATION_ERROR', 'Solo se pueden facturar órdenes con estado LISTO.', 422);
    if (orden.facturaId) return err('CONFLICT', 'Esta orden ya fue facturada.', 409);

    const body = await req.json();
    const parsed = facturarSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const precio = Number(orden.precio);
    const itbisMonto = Math.round(precio * 0.18 * 100) / 100;
    const subtotal = Math.round((precio - itbisMonto) * 100) / 100;

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
          clienteId: orden.clienteId,
          clienteNombre: orden.clienteNombre,
          metodoPago: parsed.data.metodoPago,
          estado: parsed.data.metodoPago === 'CREDITO' ? 'EMITIDA' : 'PAGADA',
          subtotal,
          itbis: itbisMonto,
          descuento: 0,
          total: precio,
          saldo: parsed.data.metodoPago === 'CREDITO' ? precio : 0,
          creadoPor: sesion.usuarioId,
          items: {
            create: [
              {
                productoNombre: orden.tipoServicio,
                cantidad: 1,
                precioUnitario: precio,
                itbisPorcentaje: 18,
                itbisMonto,
                descuento: 0,
                subtotal,
                total: precio,
              },
            ],
          },
        },
      });

      await tx.ordenCarwash.update({
        where: { id },
        data: { facturaId: nuevaFactura.id, estado: 'ENTREGADO' },
      });

      return nuevaFactura;
    });

    return ok(factura);
  } catch (error) {
    return handleApiError(error, 'POST /api/carwash/ordenes/[id]/facturar');
  }
}
