import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateCitaSchema } from '@/lib/validations/salon';

const INDUSTRIAS_SALON = ['SALON_BARBERIA'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SALON.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para salones.', 403);

    const { id } = await params;
    const cita = await prisma.cita.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true, email: true } },
      },
    });

    if (!cita) return err('NOT_FOUND', 'Cita no encontrada.', 404);
    return ok(cita);
  } catch (error) {
    return handleApiError(error, 'GET /api/salon/citas/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SALON.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para salones.', 403);

    const { id } = await params;
    const cita = await prisma.cita.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
    });
    if (!cita) return err('NOT_FOUND', 'Cita no encontrada.', 404);
    if (cita.estado === 'COMPLETADA' || cita.estado === 'CANCELADA')
      return err('VALIDATION_ERROR', 'No se puede modificar una cita cerrada.', 422);

    const body = await req.json();
    const parsed = UpdateCitaSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizada = await prisma.cita.update({
      where: { id },
      data: {
        ...parsed.data,
        fecha: parsed.data.fecha ? new Date(parsed.data.fecha) : undefined,
      },
    });

    return ok(actualizada);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/salon/citas/[id]');
  }
}
