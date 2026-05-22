import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { actualizarRepuestoSchema } from '@/lib/validations/repuestos';

const INDUSTRIAS_REPUESTOS = ['REPUESTOS'];

async function getRepuestosEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_REPUESTOS.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getRepuestosEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Repuestos.', 403);

    const { id } = await params;

    const repuesto = await prisma.repuesto.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!repuesto) return err('NOT_FOUND', 'Repuesto no encontrado.', 404);

    return ok(repuesto);
  } catch (error) {
    return handleApiError(error, 'GET /api/repuestos/inventario/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getRepuestosEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Repuestos.', 403);

    const { id } = await params;

    const repuesto = await prisma.repuesto.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!repuesto) return err('NOT_FOUND', 'Repuesto no encontrado.', 404);

    const body = await req.json();
    const parsed = actualizarRepuestoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    if (parsed.data.codigo && parsed.data.codigo !== repuesto.codigo) {
      const duplicado = await prisma.repuesto.findFirst({
        where: {
          empresaId: sesion.empresaActivaId,
          codigo: parsed.data.codigo,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (duplicado)
        return err('CONFLICT', `Ya existe un repuesto con el código ${parsed.data.codigo}.`, 409);
    }

    const actualizado = await prisma.repuesto.update({ where: { id }, data: parsed.data });

    return ok(actualizado);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/repuestos/inventario/[id]');
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getRepuestosEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Repuestos.', 403);

    const { id } = await params;

    const repuesto = await prisma.repuesto.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!repuesto) return err('NOT_FOUND', 'Repuesto no encontrado.', 404);

    await prisma.repuesto.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });

    return ok({ mensaje: 'Repuesto eliminado correctamente.' });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/repuestos/inventario/[id]');
  }
}
