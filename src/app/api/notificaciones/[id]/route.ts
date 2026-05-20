import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const { id } = await params;

    const notif = await prisma.notificacion.findFirst({ where: { id, empresaId } });
    if (!notif) return err('NOT_FOUND', 'Notificación no encontrada.', 404);

    await prisma.notificacion.update({ where: { id }, data: { estado: 'CANCELADA' } });

    return ok({ mensaje: 'Notificación cancelada.' });
  } catch (e) {
    return handleApiError(e);
  }
}
