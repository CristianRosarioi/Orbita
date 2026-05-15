import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.sesionCaja.findMany({
        where: { empresaId },
        orderBy: { fechaApertura: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { facturas: true } },
        },
      }),
      prisma.sesionCaja.count({ where: { empresaId } }),
    ]);

    // Enriquecer con total vendido por sesión
    const itemsEnriquecidos = await Promise.all(
      items.map(async (sesion) => {
        const totalVendido = await prisma.factura.aggregate({
          where: {
            empresaId,
            sesionCajaId: sesion.id,
            deletedAt: null,
            estado: { not: 'ANULADA' },
          },
          _sum: { total: true },
        });
        return {
          ...sesion,
          totalVendido: Number(totalVendido._sum.total ?? 0),
          cantidadFacturas: sesion._count.facturas,
        };
      }),
    );

    return ok({
      items: itemsEnriquecidos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/caja/historial');
  }
}
