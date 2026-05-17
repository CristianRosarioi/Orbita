import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateItemComandaSchema } from '@/lib/validations/restaurante';

const INDUSTRIAS_RESTAURANTE = ['RESTAURANTE'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_RESTAURANTE.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const { id, itemId } = await params;

    const comanda = await prisma.comanda.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
    });
    if (!comanda) return err('NOT_FOUND', 'Comanda no encontrada.', 404);

    const item = await prisma.itemComanda.findFirst({ where: { id: itemId, comandaId: id } });
    if (!item) return err('NOT_FOUND', 'Ítem no encontrado.', 404);

    const body = await req.json();
    const parsed = UpdateItemComandaSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizado = await prisma.$transaction(async (tx) => {
      const updated = await tx.itemComanda.update({
        where: { id: itemId },
        data: parsed.data,
      });

      // Recalcular totales si cambió la cantidad
      if (parsed.data.cantidad !== undefined) {
        const todosItems = await tx.itemComanda.findMany({ where: { comandaId: id } });
        const subtotal = todosItems.reduce((s, i) => s + Number(i.cantidad) * Number(i.precio), 0);
        const itbis = Math.round(subtotal * 0.18 * 100) / 100;
        const total = Math.round((subtotal + itbis + Number(comanda.propina)) * 100) / 100;
        await tx.comanda.update({ where: { id }, data: { subtotal, itbis, total } });
      }

      return updated;
    });

    return ok(actualizado);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/restaurante/comandas/[id]/items/[itemId]');
  }
}
