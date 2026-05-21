import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

const INDUSTRIAS_REPUESTOS = ['REPUESTOS'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_REPUESTOS.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para Repuestos.', 403);

    const { searchParams } = new URL(req.url);
    const marca = searchParams.get('marca') ?? undefined;
    const modelo = searchParams.get('modelo') ?? undefined;
    const anio = searchParams.get('anio') ? Number(searchParams.get('anio')) : undefined;
    const q = searchParams.get('q') ?? undefined;

    if (!marca && !modelo && !anio && !q)
      return err('VALIDATION_ERROR', 'Debes proporcionar al menos un criterio de búsqueda.', 422);

    const repuestos = await prisma.repuesto.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        deletedAt: null,
        activo: true,
        ...(marca && { marcaVehiculo: { contains: marca, mode: 'insensitive' } }),
        ...(modelo && { modeloVehiculo: { contains: modelo, mode: 'insensitive' } }),
        ...(anio && {
          AND: [
            { OR: [{ anioDesde: null }, { anioDesde: { lte: anio } }] },
            { OR: [{ anioHasta: null }, { anioHasta: { gte: anio } }] },
          ],
        }),
        ...(q && {
          OR: [
            { codigo: { contains: q.toUpperCase() } },
            { nombre: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ stock: 'desc' }, { nombre: 'asc' }],
      take: 50,
    });

    return ok(repuestos);
  } catch (error) {
    return handleApiError(error, 'GET /api/repuestos/buscar');
  }
}
