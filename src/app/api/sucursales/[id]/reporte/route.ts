import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('UNAUTHORIZED', 'Selecciona una empresa activa.', 401);

    const { id } = await params;
    const { searchParams } = req.nextUrl;

    const desde = searchParams.get('desde') ? new Date(searchParams.get('desde')!) : undefined;
    const hasta = searchParams.get('hasta') ? new Date(searchParams.get('hasta')!) : undefined;

    const sucursal = await prisma.sucursal.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!sucursal) return err('NOT_FOUND', 'Sucursal no encontrada.', 404);

    const [facturas, transferenciasOrigen, transferenciasDestino, totalStock] = await Promise.all([
      prisma.factura.aggregate({
        where: {
          sucursalId: id,
          empresaId: sesion.empresaActivaId,
          estado: { not: 'ANULADA' },
          ...(desde || hasta ? { fechaEmision: { gte: desde, lte: hasta } } : {}),
        },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.transferenciaInventario.count({
        where: { sucursalOrigenId: id, empresaId: sesion.empresaActivaId },
      }),
      prisma.transferenciaInventario.count({
        where: { sucursalDestinoId: id, empresaId: sesion.empresaActivaId },
      }),
      prisma.stockSucursal.aggregate({
        where: { sucursalId: id, empresaId: sesion.empresaActivaId },
        _sum: { cantidad: true },
        _count: { id: true },
      }),
    ]);

    return ok({
      sucursal,
      reporte: {
        totalVentas: facturas._sum.total ?? 0,
        cantidadFacturas: facturas._count.id,
        transferenciasEnviadas: transferenciasOrigen,
        transferenciasRecibidas: transferenciasDestino,
        productosEnStock: totalStock._count.id,
        unidadesEnStock: totalStock._sum.cantidad ?? 0,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
