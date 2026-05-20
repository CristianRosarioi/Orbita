import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { ActualizarPropiedadSchema } from '@/lib/validations/inmobiliaria';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const propiedad = await prisma.propiedad.findFirst({
      where: { id, empresaId, deletedAt: null },
      include: {
        contratos: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            inquilinoNombre: true,
            montoMensual: true,
            fechaInicio: true,
            fechaFin: true,
            estado: true,
          },
        },
      },
    });

    if (!propiedad) return err('NOT_FOUND', 'Propiedad no encontrada.', 404);
    return ok(propiedad);
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

    const parsed = ActualizarPropiedadSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const propiedad = await prisma.propiedad.findFirst({
      where: { id, empresaId, deletedAt: null },
    });
    if (!propiedad) return err('NOT_FOUND', 'Propiedad no encontrada.', 404);

    const actualizada = await prisma.propiedad.update({
      where: { id },
      data: parsed.data,
    });

    return ok(actualizada);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const propiedad = await prisma.propiedad.findFirst({
      where: { id, empresaId, deletedAt: null },
    });
    if (!propiedad) return err('NOT_FOUND', 'Propiedad no encontrada.', 404);

    const contratosActivos = await prisma.contratoAlquiler.count({
      where: { propiedadId: id, estado: 'ACTIVO' },
    });
    if (contratosActivos > 0)
      return err('CONFLICT', 'No puedes eliminar una propiedad con contratos activos.', 409);

    await prisma.propiedad.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
