import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

const INDUSTRIAS_CARWASH = ['CARWASH'];

async function getCarwashEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_CARWASH.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCarwashEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Carwash.', 403);

    const cola = await prisma.ordenCarwash.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        estado: { in: ['EN_COLA', 'EN_PROCESO'] },
        deletedAt: null,
      },
      orderBy: [{ estado: 'asc' }, { createdAt: 'asc' }],
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
      },
    });

    return ok(cola);
  } catch (error) {
    return handleApiError(error, 'GET /api/carwash/cola');
  }
}
