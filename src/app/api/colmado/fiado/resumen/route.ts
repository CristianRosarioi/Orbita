import { auth } from '@clerk/nextjs/server';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const INDUSTRIAS_COLMADO = ['COLMADO', 'TIENDA_ONLINE', 'FARMACIA', 'TIENDA_ROPA'];

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_COLMADO.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo no está disponible para tu industria.', 403);

    const empresaId = sesion.empresaActivaId;

    const [totales, topDeudores, totalCuentas] = await Promise.all([
      prisma.cuentaFiado.aggregate({
        where: { empresaId, estado: { not: 'PAGADO' } },
        _sum: { saldo: true },
        _count: true,
      }),
      prisma.cuentaFiado.findMany({
        where: { empresaId, saldo: { gt: 0 } },
        orderBy: { saldo: 'desc' },
        take: 5,
        include: {
          cliente: { select: { nombre: true, nombreComercial: true } },
        },
      }),
      prisma.cuentaFiado.count({ where: { empresaId } }),
    ]);

    return ok({
      totalPendiente: Number(totales._sum.saldo ?? 0),
      cuentasActivas: totales._count,
      totalCuentas,
      topDeudores,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/colmado/fiado/resumen');
  }
}
