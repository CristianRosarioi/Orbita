import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { UpdateCategoriaSchema } from '@/lib/validations/categorias';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const existente = await prisma.categoria.findFirst({
      where: { id, empresaId, deletedAt: null },
    });
    if (!existente) return err('NOT_FOUND', 'Categoría no encontrada.', 404);

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = UpdateCategoriaSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const updated = await prisma.categoria.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/categorias/[id]');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const existente = await prisma.categoria.findFirst({
      where: { id, empresaId, deletedAt: null },
      include: { _count: { select: { productos: { where: { deletedAt: null } } } } },
    });
    if (!existente) return err('NOT_FOUND', 'Categoría no encontrada.', 404);

    if (existente._count.productos > 0) {
      return err(
        'CONFLICT',
        'No puedes eliminar una categoría que tiene productos asignados.',
        409,
      );
    }

    await prisma.categoria.update({ where: { id }, data: { deletedAt: new Date() } });
    return ok({ message: 'Categoría eliminada.' });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/categorias/[id]');
  }
}
