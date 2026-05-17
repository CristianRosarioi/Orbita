import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa, requireRole, getCurrentUser } from '@/lib/auth';
import { ActualizarRolSchema } from '@/lib/validations/usuarios';

// PATCH /api/usuarios/[id] — cambiar rol (OWNER/ADMIN only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['OWNER', 'ADMIN']);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const body = await req.json();
    const data = ActualizarRolSchema.parse(body);

    const miembro = await prisma.miembroEmpresa.findFirst({
      where: { id, empresaId },
    });
    if (!miembro) return err('NOT_FOUND', 'El miembro no existe en esta empresa.', 404);
    if (miembro.rol === 'OWNER')
      return err('FORBIDDEN', 'No se puede cambiar el rol del Propietario.', 403);

    const actualizado = await prisma.miembroEmpresa.update({
      where: { id },
      data: { rol: data.rol },
      include: {
        usuario: { select: { id: true, email: true, nombre: true, apellido: true } },
      },
    });

    return ok(actualizado);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'EMPRESA_REQUERIDA')
        return err('UNAUTHORIZED', 'No tienes una empresa activa.', 401);
      if (error.message === 'FORBIDDEN')
        return err('FORBIDDEN', 'No tienes permisos para cambiar roles.', 403);
      if (error.message === 'SIN_MEMBRESIA')
        return err('UNAUTHORIZED', 'No tienes acceso a esta empresa.', 401);
    }
    return handleApiError(error, 'PATCH /api/usuarios/[id]');
  }
}

// DELETE /api/usuarios/[id] — remover miembro (OWNER only)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['OWNER']);
    const empresaId = await requireEmpresa();
    const { id } = await params;
    const usuarioActual = await getCurrentUser();
    if (!usuarioActual) return err('UNAUTHORIZED', 'No autenticado.', 401);

    const miembro = await prisma.miembroEmpresa.findFirst({
      where: { id, empresaId },
      include: { usuario: { select: { id: true } } },
    });
    if (!miembro) return err('NOT_FOUND', 'El miembro no existe en esta empresa.', 404);
    if (miembro.rol === 'OWNER')
      return err('FORBIDDEN', 'No se puede remover al Propietario.', 403);
    if (miembro.usuario.id === usuarioActual.id) {
      return err('FORBIDDEN', 'No puedes removerte a ti mismo.', 403);
    }

    await prisma.miembroEmpresa.update({
      where: { id },
      data: { activo: false },
    });

    return ok({ mensaje: 'Usuario removido correctamente.' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'EMPRESA_REQUERIDA')
        return err('UNAUTHORIZED', 'No tienes una empresa activa.', 401);
      if (error.message === 'FORBIDDEN')
        return err('FORBIDDEN', 'No tienes permisos para remover usuarios.', 403);
      if (error.message === 'SIN_MEMBRESIA')
        return err('UNAUTHORIZED', 'No tienes acceso a esta empresa.', 401);
    }
    return handleApiError(error, 'DELETE /api/usuarios/[id]');
  }
}
