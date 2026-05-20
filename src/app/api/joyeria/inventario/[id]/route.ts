import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { ActualizarPiezaSchema } from '@/lib/validations/joyeria';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const pieza = await prisma.piezaJoya.findFirst({
      where: { id, empresaId, deletedAt: null },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        reparaciones: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!pieza) return err('NOT_FOUND', 'Pieza no encontrada.', 404);
    return ok(pieza);
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

    const parsed = ActualizarPiezaSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const pieza = await prisma.piezaJoya.findFirst({
      where: { id, empresaId, deletedAt: null },
    });
    if (!pieza) return err('NOT_FOUND', 'Pieza no encontrada.', 404);

    const actualizada = await prisma.piezaJoya.update({
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

    const pieza = await prisma.piezaJoya.findFirst({
      where: { id, empresaId, deletedAt: null },
    });
    if (!pieza) return err('NOT_FOUND', 'Pieza no encontrada.', 404);

    await prisma.piezaJoya.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
