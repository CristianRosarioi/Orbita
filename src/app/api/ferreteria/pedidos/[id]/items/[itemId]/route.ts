import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

const INDUSTRIAS_FERRETERIA = ['FERRETERIA', 'MATERIALES', 'PINTURAS'];

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_FERRETERIA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para ferreterías.', 403);

    const { id, itemId } = await params;
    const pedido = await prisma.pedidoProveedor.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!pedido) return err('NOT_FOUND', 'Pedido no encontrado.', 404);
    if (pedido.estado !== 'BORRADOR')
      return err('VALIDATION_ERROR', 'Solo se pueden eliminar ítems de pedidos en borrador.', 422);

    const item = await prisma.itemPedidoProveedor.findFirst({
      where: { id: itemId, pedidoId: id },
    });
    if (!item) return err('NOT_FOUND', 'Ítem no encontrado.', 404);

    await prisma.$transaction(async (tx) => {
      await tx.itemPedidoProveedor.delete({ where: { id: itemId } });

      const restantes = await tx.itemPedidoProveedor.findMany({
        where: { pedidoId: id },
        select: { subtotal: true },
      });
      const total = restantes.reduce((s, i) => s + Number(i.subtotal), 0);

      await tx.pedidoProveedor.update({ where: { id }, data: { total } });
    });

    return ok({ id: itemId });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/ferreteria/pedidos/[id]/items/[itemId]');
  }
}
