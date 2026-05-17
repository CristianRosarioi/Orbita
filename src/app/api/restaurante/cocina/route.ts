import { auth } from '@clerk/nextjs/server';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const INDUSTRIAS_RESTAURANTE = ['RESTAURANTE'];

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_RESTAURANTE.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const comandas = await prisma.comanda.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        estado: { in: ['ABIERTA', 'LISTA'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        mesa: { select: { numero: true, nombre: true } },
        items: {
          where: { estado: { not: 'CANCELADO' } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return ok(comandas);
  } catch (error) {
    return handleApiError(error, 'GET /api/restaurante/cocina');
  }
}
