import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { FacturarOrdenTrabajoSchema } from '@/lib/validations/taller';
import { generarNumeroFactura } from '@/lib/facturacion';

const INDUSTRIAS_TALLER = ['TALLER_MECANICO', 'CARWASH', 'REPUESTOS'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para talleres.', 403);

    const { id } = await params;
    const orden = await prisma.ordenTrabajo.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
      include: { items: true },
    });
    if (!orden) return err('NOT_FOUND', 'Orden de trabajo no encontrada.', 404);
    if (orden.estado !== 'LISTO')
      return err('VALIDATION_ERROR', 'Solo se pueden facturar órdenes con estado LISTO.', 422);
    if (orden.facturaId)
      return err('VALIDATION_ERROR', 'Esta orden ya fue facturada.', 422);
    if (orden.items.length === 0)
      return err('VALIDATION_ERROR', 'La orden no tiene ítems para facturar.', 422);

    const body = await req.json();
    const parsed = FacturarOrdenTrabajoSchema.safeParse(body);
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
          clienteId: orden.clienteId,
          clienteNombre: orden.clienteNombre,
          metodoPago: parsed.data.metodoPago,
          estado: parsed.data.metodoPago === 'CREDITO' ? 'EMITIDA' : 'PAGADA',
          subtotal: orden.subtotal,
          itbis: orden.itbis,
          descuento: 0,
          total: orden.total,
          saldo: parsed.data.metodoPago === 'CREDITO' ? orden.total : 0,
          creadoPor: sesion.usuarioId,
          items: {
            create: orden.items.map((item) => ({
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

      await tx.ordenTrabajo.update({
        where: { id },
        data: { facturaId: nuevaFactura.id, estado: 'ENTREGADO', fechaEntrega: new Date() },
      });

      return nuevaFactura;
    });

    return ok(factura);
  } catch (error) {
    return handleApiError(error, 'POST /api/taller/ordenes/[id]/facturar');
  }
}
