import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('UNAUTHORIZED', 'Selecciona una empresa activa.', 401);

    const { id } = await params;

    const sucursal = await prisma.sucursal.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!sucursal) return err('NOT_FOUND', 'Sucursal no encontrada.', 404);

    const stock = await prisma.stockSucursal.findMany({
      where: { sucursalId: id, empresaId: sesion.empresaActivaId },
      include: {
        producto: {
          select: { id: true, nombre: true, sku: true, stockMinimo: true },
        },
      },
      orderBy: { producto: { nombre: 'asc' } },
    });

    const stockConAlerta = stock.map((s) => ({
      ...s,
      bajoMinimo: Number(s.cantidad) < Number(s.producto.stockMinimo),
    }));

    return ok(stockConAlerta);
  } catch (e) {
    return handleApiError(e);
  }
}
