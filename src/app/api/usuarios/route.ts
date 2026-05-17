import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa, requireRole } from '@/lib/auth';

export async function GET() {
  try {
    await requireRole(['OWNER', 'ADMIN', 'VIEWER']);
    const empresaId = await requireEmpresa();

    const miembros = await prisma.miembroEmpresa.findMany({
      where: { empresaId },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombre: true,
            apellido: true,
            avatar: true,
            clerkId: true,
          },
        },
      },
      orderBy: [{ rol: 'asc' }, { createdAt: 'asc' }],
    });

    return ok(miembros);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'EMPRESA_REQUERIDA')
        return err('UNAUTHORIZED', 'No tienes una empresa activa.', 401);
      if (error.message === 'FORBIDDEN')
        return err('FORBIDDEN', 'No tienes permisos para ver los usuarios.', 403);
      if (error.message === 'SIN_MEMBRESIA')
        return err('UNAUTHORIZED', 'No tienes acceso a esta empresa.', 401);
    }
    return handleApiError(error, 'GET /api/usuarios');
  }
}
