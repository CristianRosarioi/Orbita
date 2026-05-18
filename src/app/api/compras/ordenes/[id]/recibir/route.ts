import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { RecibirOrdenSchema } from '@/lib/validations/compras';
import { crearAsientoCompra } from '@/lib/asientos';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { id } = await params;
    const empresaId = sesion.empresaActivaId;

    const orden = await prisma.ordenCompra.findFirst({
      where: { id, empresaId, deletedAt: null },
      include: { items: true },
    });
    if (!orden) return err('NOT_FOUND', 'Orden de compra no encontrada.', 404);
    if (!['ENVIADA', 'RECIBIDA_PARCIAL'].includes(orden.estado)) {
      return err(
        'VALIDATION_ERROR',
        'Solo se puede recibir una orden enviada o parcialmente recibida.',
        422,
      );
    }

    const body = await req.json();
    const parsed = RecibirOrdenSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const ordenActualizada = await prisma.$transaction(async (tx) => {
      for (const recepcion of parsed.data.items) {
        const item = orden.items.find((i) => i.id === recepcion.itemId);
        if (!item) continue;

        const nuevaCantidadRecibida = Number(item.cantidadRecibida) + recepcion.cantidadRecibida;

        await tx.itemOrdenCompra.update({
          where: { id: recepcion.itemId },
          data: { cantidadRecibida: nuevaCantidadRecibida },
        });

        // Actualizar inventario si hay productoId
        if (item.productoId && recepcion.cantidadRecibida > 0) {
          const producto = await tx.producto.findFirst({
            where: { id: item.productoId, empresaId },
          });
          if (producto) {
            const stockAntes = Number(producto.stockActual);
            const stockDespues = stockAntes + recepcion.cantidadRecibida;

            await tx.producto.update({
              where: { id: item.productoId },
              data: { stockActual: stockDespues },
            });

            await tx.movimientoInventario.create({
              data: {
                empresaId,
                productoId: item.productoId,
                ordenCompraId: id,
                tipo: 'COMPRA',
                cantidad: recepcion.cantidadRecibida,
                stockAntes,
                stockDespues,
                notas: parsed.data.notas,
                creadoPor: userId,
              },
            });
          }
        }
      }

      // Determinar nuevo estado de la orden
      const itemsActualizados = await tx.itemOrdenCompra.findMany({
        where: { ordenCompraId: id },
      });

      const todosRecibidos = itemsActualizados.every(
        (i) => Number(i.cantidadRecibida) >= Number(i.cantidad),
      );
      const algunoRecibido = itemsActualizados.some((i) => Number(i.cantidadRecibida) > 0);

      const nuevoEstado = todosRecibidos
        ? 'RECIBIDA'
        : algunoRecibido
          ? 'RECIBIDA_PARCIAL'
          : orden.estado;

      const updated = await tx.ordenCompra.update({
        where: { id },
        data: {
          estado: nuevoEstado,
          fechaRecibida: todosRecibidos ? new Date() : undefined,
        },
        include: { items: true },
      });

      // Crear asiento contable
      await crearAsientoCompra(id, empresaId, userId, tx);

      return updated;
    });

    return ok(ordenActualizada);
  } catch (error) {
    return handleApiError(error, 'POST /api/compras/ordenes/[id]/recibir');
  }
}
