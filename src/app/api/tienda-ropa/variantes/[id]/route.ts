import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { actualizarVarianteSchema } from '@/lib/validations/tienda-ropa';

const INDUSTRIAS_TIENDA_ROPA = ['TIENDA_ROPA'];

async function getTiendaRopaEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_TIENDA_ROPA.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaRopaEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda de Ropa.', 403);

    const { id } = await params;

    const variante = await prisma.variante.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
    });
    if (!variante) return err('NOT_FOUND', 'Variante no encontrada.', 404);

    const body = await req.json();
    const parsed = actualizarVarianteSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizada = await prisma.variante.update({
      where: { id },
      data: parsed.data,
    });

    return ok(actualizada);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/tienda-ropa/variantes/[id]');
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaRopaEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda de Ropa.', 403);

    const { id } = await params;

    const variante = await prisma.variante.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
    });
    if (!variante) return err('NOT_FOUND', 'Variante no encontrada.', 404);

    await prisma.variante.update({
      where: { id },
      data: { activa: false },
    });

    return ok({ mensaje: 'Variante desactivada correctamente.' });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/tienda-ropa/variantes/[id]');
  }
}
