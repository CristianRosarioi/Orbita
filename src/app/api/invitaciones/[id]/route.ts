import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa, requireRole } from '@/lib/auth';

// DELETE /api/invitaciones/[id] — cancelar invitación pendiente
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['OWNER', 'ADMIN']);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const invitacion = await prisma.invitacion.findFirst({
      where: { id, empresaId },
    });
    if (!invitacion) return err('NOT_FOUND', 'La invitación no existe.', 404);
    if (invitacion.estado !== 'PENDIENTE') {
      return err('CONFLICT', 'Solo se pueden cancelar invitaciones pendientes.', 409);
    }

    await prisma.invitacion.update({
      where: { id },
      data: { estado: 'RECHAZADA' },
    });

    return ok({ mensaje: 'Invitación cancelada.' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'EMPRESA_REQUERIDA') return err('UNAUTHORIZED', 'No tienes una empresa activa.', 401);
      if (error.message === 'FORBIDDEN') return err('FORBIDDEN', 'No tienes permisos para cancelar invitaciones.', 403);
      if (error.message === 'SIN_MEMBRESIA') return err('UNAUTHORIZED', 'No tienes acceso a esta empresa.', 401);
    }
    return handleApiError(error, 'DELETE /api/invitaciones/[id]');
  }
}
