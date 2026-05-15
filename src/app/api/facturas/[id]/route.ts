import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const { id } = await params;

    const factura = await prisma.factura.findFirst({
      where: { id, empresaId, deletedAt: null },
      include: {
        items: true,
        pagos: { orderBy: { fechaPago: 'desc' } },
        cliente: {
          select: {
            id: true,
            nombre: true,
            identificacion: true,
            tipoIdentificacion: true,
            email: true,
            telefono: true,
          },
        },
      },
    });

    if (!factura) return err('NOT_FOUND', 'Factura no encontrada.', 404);

    return ok(factura);
  } catch (error) {
    return handleApiError(error, 'GET /api/facturas/[id]');
  }
}
