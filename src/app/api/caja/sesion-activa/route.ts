import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa, getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const usuario = await getCurrentUser();
    if (!usuario) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await prisma.sesionCaja.findFirst({
      where: {
        empresaId,
        usuarioId: usuario.id,
        estado: 'ABIERTA',
      },
      orderBy: { fechaApertura: 'desc' },
    });

    return ok(sesion);
  } catch (error) {
    return handleApiError(error, 'GET /api/caja/sesion-activa');
  }
}
