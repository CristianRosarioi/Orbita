import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { ActualizarReparacionSchema } from '@/lib/validations/joyeria';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const reparacion = await prisma.reparacionJoya.findFirst({
      where: { id, empresaId },
      include: {
        pieza: true,
        cliente: { select: { id: true, nombre: true, telefono: true, email: true } },
      },
    });

    if (!reparacion) return err('NOT_FOUND', 'Reparación no encontrada.', 404);
    return ok(reparacion);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'Formato inválido.', 400);

    const parsed = ActualizarReparacionSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const reparacion = await prisma.reparacionJoya.findFirst({
      where: { id, empresaId },
    });
    if (!reparacion) return err('NOT_FOUND', 'Reparación no encontrada.', 404);

    const actualizada = await prisma.$transaction(async (tx) => {
      const r = await tx.reparacionJoya.update({
        where: { id },
        data: parsed.data,
      });
      if (parsed.data.estado === 'ENTREGADA' && reparacion.piezaId) {
        await tx.piezaJoya.update({
          where: { id: reparacion.piezaId },
          data: { estado: 'EN_VITRINA' },
        });
      }
      return r;
    });

    return ok(actualizada);
  } catch (e) {
    return handleApiError(e);
  }
}
