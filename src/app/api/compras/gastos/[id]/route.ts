import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateGastoSchema } from '@/lib/validations/compras';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { id } = await params;
    const gasto = await prisma.gasto.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
      include: {
        proveedor: { select: { id: true, nombre: true, nombreComercial: true, identificacion: true } },
      },
    });

    if (!gasto) return err('NOT_FOUND', 'Gasto no encontrado.', 404);
    return ok(gasto);
  } catch (error) {
    return handleApiError(error, 'GET /api/compras/gastos/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { id } = await params;
    const gasto = await prisma.gasto.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!gasto) return err('NOT_FOUND', 'Gasto no encontrado.', 404);

    const body = await req.json();
    const parsed = UpdateGastoSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    void userId;

    const actualizado = await prisma.gasto.update({
      where: { id },
      data: {
        estado: parsed.data.estado,
        fechaPago: parsed.data.estado === 'PAGADO' && parsed.data.fechaPago
          ? new Date(parsed.data.fechaPago)
          : parsed.data.estado === 'PAGADO'
            ? new Date()
            : undefined,
        notas: parsed.data.notas,
      },
      include: { proveedor: { select: { nombre: true } } },
    });

    return ok(actualizado);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/compras/gastos/[id]');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { id } = await params;
    void userId;

    const gasto = await prisma.gasto.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!gasto) return err('NOT_FOUND', 'Gasto no encontrado.', 404);

    await prisma.gasto.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/compras/gastos/[id]');
  }
}
