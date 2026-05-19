import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateOrdenTrabajoSchema } from '@/lib/validations/taller';

const INDUSTRIAS_TALLER = ['TALLER_MECANICO', 'CARWASH', 'REPUESTOS'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para talleres.', 403);

    const { id } = await params;
    const orden = await prisma.ordenTrabajo.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!orden) return err('NOT_FOUND', 'Orden de trabajo no encontrada.', 404);
    return ok(orden);
  } catch (error) {
    return handleApiError(error, 'GET /api/taller/ordenes/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para talleres.', 403);

    const { id } = await params;
    const orden = await prisma.ordenTrabajo.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!orden) return err('NOT_FOUND', 'Orden de trabajo no encontrada.', 404);
    if (orden.estado === 'ENTREGADO' || orden.estado === 'CANCELADO')
      return err('VALIDATION_ERROR', 'No se puede modificar una orden cerrada.', 422);

    const body = await req.json();
    const parsed = UpdateOrdenTrabajoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizada = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        ...parsed.data,
        fechaPromesa: parsed.data.fechaPromesa ? new Date(parsed.data.fechaPromesa) : undefined,
        fechaEntrega:
          parsed.data.estado === 'ENTREGADO' ? new Date() : undefined,
      },
      include: { items: true },
    });

    return ok(actualizada);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/taller/ordenes/[id]');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para talleres.', 403);

    const { id } = await params;
    const orden = await prisma.ordenTrabajo.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!orden) return err('NOT_FOUND', 'Orden de trabajo no encontrada.', 404);
    if (orden.estado !== 'RECIBIDO' && orden.estado !== 'EN_DIAGNOSTICO')
      return err('VALIDATION_ERROR', 'Solo se pueden cancelar órdenes en estado inicial.', 422);

    await prisma.ordenTrabajo.update({ where: { id }, data: { deletedAt: new Date() } });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/taller/ordenes/[id]');
  }
}
