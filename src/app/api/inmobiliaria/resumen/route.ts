import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const mesActual = new Date().toISOString().substring(0, 7);
    const hoy = new Date();
    const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [disponibles, contratosActivos, cobrosDelMes, vencimientosProximos] = await Promise.all([
      prisma.propiedad.count({ where: { empresaId, estado: 'DISPONIBLE', deletedAt: null } }),
      prisma.contratoAlquiler.count({ where: { empresaId, estado: 'ACTIVO' } }),
      prisma.pagoAlquiler.aggregate({
        where: { empresaId, mes: mesActual, estado: 'PAGADO' },
        _sum: { monto: true },
      }),
      prisma.contratoAlquiler.findMany({
        where: {
          empresaId,
          estado: 'ACTIVO',
          fechaFin: { lte: en30Dias, gte: hoy },
        },
        include: { propiedad: { select: { codigo: true, nombre: true } } },
        orderBy: { fechaFin: 'asc' },
      }),
    ]);

    return ok({
      disponibles,
      contratosActivos,
      cobrosDelMes: Number(cobrosDelMes._sum.monto ?? 0),
      vencimientosProximos,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
