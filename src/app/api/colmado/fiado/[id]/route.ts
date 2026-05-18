import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

const INDUSTRIAS_COLMADO = ['COLMADO', 'TIENDA_ONLINE', 'FARMACIA', 'TIENDA_ROPA'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_COLMADO.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo no está disponible para tu industria.', 403);

    const { id } = await params;
    const cuenta = await prisma.cuentaFiado.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
      include: {
        cliente: {
          select: { id: true, nombre: true, nombreComercial: true, telefono: true, email: true },
        },
        movimientos: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!cuenta) return err('NOT_FOUND', 'Cuenta de fiado no encontrada.', 404);
    return ok(cuenta);
  } catch (error) {
    return handleApiError(error, 'GET /api/colmado/fiado/[id]');
  }
}
