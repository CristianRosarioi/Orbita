import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { actualizarOrdenCarwashSchema } from '@/lib/validations/carwash';

const INDUSTRIAS_CARWASH = ['CARWASH'];

async function getCarwashEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_CARWASH.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCarwashEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Carwash.', 403);

    const { id } = await params;

    const orden = await prisma.ordenCarwash.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
      },
    });
    if (!orden) return err('NOT_FOUND', 'Orden no encontrada.', 404);

    return ok(orden);
  } catch (error) {
    return handleApiError(error, 'GET /api/carwash/ordenes/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCarwashEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Carwash.', 403);

    const { id } = await params;

    const orden = await prisma.ordenCarwash.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!orden) return err('NOT_FOUND', 'Orden no encontrada.', 404);
    if (orden.estado === 'ENTREGADO')
      return err('CONFLICT', 'No se puede modificar una orden ya entregada.', 409);

    const body = await req.json();
    const parsed = actualizarOrdenCarwashSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizada = await prisma.ordenCarwash.update({
      where: { id },
      data: parsed.data,
      include: {
        cliente: { select: { id: true, nombre: true } },
      },
    });

    return ok(actualizada);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/carwash/ordenes/[id]');
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCarwashEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Carwash.', 403);

    const { id } = await params;

    const orden = await prisma.ordenCarwash.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!orden) return err('NOT_FOUND', 'Orden no encontrada.', 404);
    if (orden.facturaId)
      return err('CONFLICT', 'No se puede eliminar una orden que ya fue facturada.', 409);

    await prisma.ordenCarwash.update({
      where: { id },
      data: { deletedAt: new Date(), estado: 'CANCELADO' },
    });

    return ok({ mensaje: 'Orden cancelada correctamente.' });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/carwash/ordenes/[id]');
  }
}
