import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { UpdateUnidadMedidaSchema } from '@/lib/validations/unidades-medida';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const existente = await prisma.unidadMedida.findFirst({ where: { id, empresaId, deletedAt: null } });
    if (!existente) return err('NOT_FOUND', 'Unidad de medida no encontrada.', 404);
    if (existente.esBase) return err('FORBIDDEN', 'Las unidades base no se pueden modificar.', 403);

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = UpdateUnidadMedidaSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const updated = await prisma.unidadMedida.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/unidades-medida/[id]');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const existente = await prisma.unidadMedida.findFirst({ where: { id, empresaId, deletedAt: null } });
    if (!existente) return err('NOT_FOUND', 'Unidad de medida no encontrada.', 404);
    if (existente.esBase) return err('FORBIDDEN', 'Las unidades base no se pueden eliminar.', 403);

    await prisma.unidadMedida.update({ where: { id }, data: { deletedAt: new Date() } });
    return ok({ message: 'Unidad de medida eliminada.' });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/unidades-medida/[id]');
  }
}
