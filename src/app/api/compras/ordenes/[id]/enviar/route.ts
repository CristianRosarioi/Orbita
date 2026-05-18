import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { id } = await params;
    const orden = await prisma.ordenCompra.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!orden) return err('NOT_FOUND', 'Orden de compra no encontrada.', 404);
    if (orden.estado !== 'BORRADOR')
      return err('VALIDATION_ERROR', 'Solo se pueden enviar órdenes en borrador.', 422);

    const actualizada = await prisma.ordenCompra.update({
      where: { id },
      data: { estado: 'ENVIADA' },
    });

    return ok(actualizada);
  } catch (error) {
    return handleApiError(error, 'POST /api/compras/ordenes/[id]/enviar');
  }
}
