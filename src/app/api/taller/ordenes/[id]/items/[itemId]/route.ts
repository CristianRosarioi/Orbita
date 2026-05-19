import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

const INDUSTRIAS_TALLER = ['TALLER_MECANICO', 'CARWASH', 'REPUESTOS'];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para talleres.', 403);

    const { id, itemId } = await params;

    const orden = await prisma.ordenTrabajo.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!orden) return err('NOT_FOUND', 'Orden de trabajo no encontrada.', 404);
    if (orden.estado === 'ENTREGADO' || orden.estado === 'CANCELADO')
      return err('VALIDATION_ERROR', 'No se pueden eliminar ítems de una orden cerrada.', 422);

    const item = await prisma.itemOrdenTrabajo.findFirst({
      where: { id: itemId, ordenTrabajoId: id },
    });
    if (!item) return err('NOT_FOUND', 'Ítem no encontrado.', 404);

    await prisma.$transaction(async (tx) => {
      await tx.itemOrdenTrabajo.delete({ where: { id: itemId } });

      const itemsRestantes = await tx.itemOrdenTrabajo.findMany({
        where: { ordenTrabajoId: id },
      });

      const nuevoSubtotal = round2(itemsRestantes.reduce((s, i) => s + Number(i.subtotal), 0));
      const nuevoItbis = round2(itemsRestantes.reduce((s, i) => s + Number(i.itbisMonto), 0));
      const nuevoTotal = round2(itemsRestantes.reduce((s, i) => s + Number(i.total), 0));

      await tx.ordenTrabajo.update({
        where: { id },
        data: { subtotal: nuevoSubtotal, itbis: nuevoItbis, total: nuevoTotal },
      });
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/taller/ordenes/[id]/items/[itemId]');
  }
}
