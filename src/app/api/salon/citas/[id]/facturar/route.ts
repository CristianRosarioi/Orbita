import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { generarNumeroFactura } from '@/lib/facturacion';

const INDUSTRIAS_SALON = ['SALON_BARBERIA'];

const FacturarCitaSchema = z.object({
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO']).default('EFECTIVO'),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SALON.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para salones.', 403);

    const { id } = await params;
    const cita = await prisma.cita.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
    });
    if (!cita) return err('NOT_FOUND', 'Cita no encontrada.', 404);
    if (cita.estado !== 'COMPLETADA')
      return err('VALIDATION_ERROR', 'Solo se pueden facturar citas completadas.', 422);
    if (cita.facturaId) return err('VALIDATION_ERROR', 'Esta cita ya fue facturada.', 422);

    const body = await req.json();
    const parsed = FacturarCitaSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const precio = Number(cita.precio);
    const itbisMonto = Math.round(precio * 0.18 * 100) / 100;
    const subtotal = precio;
    const total = Math.round((subtotal + itbisMonto) * 100) / 100;

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
          clienteId: cita.clienteId,
          clienteNombre: cita.clienteNombre,
          metodoPago: parsed.data.metodoPago,
          estado: parsed.data.metodoPago === 'CREDITO' ? 'EMITIDA' : 'PAGADA',
          subtotal,
          itbis: itbisMonto,
          descuento: 0,
          total,
          saldo: parsed.data.metodoPago === 'CREDITO' ? total : 0,
          creadoPor: sesion.usuarioId,
          items: {
            create: [
              {
                productoNombre: cita.servicio,
                cantidad: 1,
                precioUnitario: precio,
                itbisPorcentaje: 18,
                itbisMonto,
                descuento: 0,
                subtotal,
                total,
              },
            ],
          },
        },
      });

      await tx.cita.update({
        where: { id },
        data: { facturaId: nuevaFactura.id },
      });

      return nuevaFactura;
    });

    return ok({ facturaId: factura.id, numero: factura.numero, total: factura.total });
  } catch (error) {
    return handleApiError(error, 'POST /api/salon/citas/[id]/facturar');
  }
}
