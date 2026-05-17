import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateMesaSchema } from '@/lib/validations/restaurante';

const INDUSTRIAS_RESTAURANTE = ['RESTAURANTE'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_RESTAURANTE.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const { id } = await params;
    const mesa = await prisma.mesa.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
    });
    if (!mesa) return err('NOT_FOUND', 'Mesa no encontrada.', 404);

    const body = await req.json();
    const parsed = UpdateMesaSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizada = await prisma.mesa.update({
      where: { id },
      data: parsed.data,
    });

    return ok(actualizada);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/restaurante/mesas/[id]');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_RESTAURANTE.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const { id } = await params;
    const mesa = await prisma.mesa.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
    });
    if (!mesa) return err('NOT_FOUND', 'Mesa no encontrada.', 404);

    await prisma.mesa.update({ where: { id }, data: { activa: false } });
    return ok({ id });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/restaurante/mesas/[id]');
  }
}
