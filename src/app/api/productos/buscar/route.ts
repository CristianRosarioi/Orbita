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

    const q = req.nextUrl.searchParams.get('q') ?? '';
    if (q.length < 2) return ok({ items: [] });

    const items = await prisma.producto.findMany({
      where: {
        empresaId,
        deletedAt: null,
        activo: true,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { codigoBarras: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { unidadMedida: true },
      take: 10,
      orderBy: { nombre: 'asc' },
    });

    return ok({ items });
  } catch (error) {
    return handleApiError(error, 'GET /api/productos/buscar');
  }
}
