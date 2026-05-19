import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateEmpleadoSchema } from '@/lib/validations/nomina';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { id } = await params;
    const empleado = await prisma.empleado.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });

    if (!empleado) return err('NOT_FOUND', 'Empleado no encontrado.', 404);
    return ok(empleado);
  } catch (error) {
    return handleApiError(error, 'GET /api/nomina/empleados/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { id } = await params;
    const empleado = await prisma.empleado.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!empleado) return err('NOT_FOUND', 'Empleado no encontrado.', 404);

    const body = await req.json();
    const parsed = UpdateEmpleadoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const { email, fechaIngreso, fechaSalida, salarioBase, ...rest } = parsed.data;

    const actualizado = await prisma.empleado.update({
      where: { id },
      data: {
        ...rest,
        email: email !== undefined ? email || null : undefined,
        salarioBase: salarioBase !== undefined ? salarioBase : undefined,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
        fechaSalida: fechaSalida ? new Date(fechaSalida) : undefined,
      },
    });

    return ok(actualizado);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/nomina/empleados/[id]');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { id } = await params;
    const empleado = await prisma.empleado.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!empleado) return err('NOT_FOUND', 'Empleado no encontrado.', 404);

    const tieneNominas = await prisma.itemNomina.findFirst({
      where: { empleadoId: id },
    });
    if (tieneNominas)
      return err('VALIDATION_ERROR', 'No puedes eliminar un empleado con nóminas procesadas.', 422);

    await prisma.empleado.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/nomina/empleados/[id]');
  }
}
