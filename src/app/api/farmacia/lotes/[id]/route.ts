import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateLoteSchema } from '@/lib/validations/farmacia';

const INDUSTRIAS_FARMACIA = ['FARMACIA', 'BOTICA', 'DROGUERIA'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_FARMACIA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para farmacias.', 403);

    const { id } = await params;
    const lote = await prisma.lote.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
      include: {
        producto: { select: { id: true, nombre: true, sku: true, precioVenta: true } },
      },
    });

    if (!lote) return err('NOT_FOUND', 'Lote no encontrado.', 404);
    return ok(lote);
  } catch (error) {
    return handleApiError(error, 'GET /api/farmacia/lotes/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_FARMACIA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para farmacias.', 403);

    const { id } = await params;
    const lote = await prisma.lote.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
    });
    if (!lote) return err('NOT_FOUND', 'Lote no encontrado.', 404);

    const body = await req.json();
    const parsed = UpdateLoteSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizado = await prisma.lote.update({
      where: { id },
      data: parsed.data,
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
      },
    });

    return ok(actualizado);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/farmacia/lotes/[id]');
  }
}
