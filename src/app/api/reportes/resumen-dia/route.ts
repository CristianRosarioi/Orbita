import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const [facturasHoy, clientesActivos, productosActivos] = await Promise.all([
      prisma.factura.findMany({
        where: {
          empresaId,
          deletedAt: null,
          estado: { in: ['PAGADA', 'EMITIDA'] },
          fechaEmision: { gte: hoyInicio, lte: hoyFin },
        },
        select: { total: true },
      }),
      prisma.cliente.count({
        where: { empresaId, deletedAt: null, activo: true },
      }),
      prisma.producto.count({
        where: { empresaId, deletedAt: null, activo: true },
      }),
    ]);

    const ventasHoy = facturasHoy.reduce((sum, f) => sum + Number(f.total), 0);

    return ok({
      ventasHoy,
      facturasHoy: facturasHoy.length,
      clientesActivos,
      productosActivos,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/reportes/resumen-dia');
  }
}
