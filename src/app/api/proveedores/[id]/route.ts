import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { UpdateProveedorSchema } from '@/lib/validations/proveedores';

async function getProveedor(id: string, empresaId: string) {
  return prisma.proveedor.findFirst({ where: { id, empresaId, deletedAt: null } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;
    const proveedor = await getProveedor(id, empresaId);
    if (!proveedor) return err('NOT_FOUND', 'Proveedor no encontrado.', 404);
    return ok(proveedor);
  } catch (error) {
    return handleApiError(error, 'GET /api/proveedores/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const existente = await getProveedor(id, empresaId);
    if (!existente) return err('NOT_FOUND', 'Proveedor no encontrado.', 404);

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = UpdateProveedorSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const { tipoIdentificacion, email, ...rest } = parsed.data;
    const updated = await prisma.proveedor.update({
      where: { id },
      data: {
        ...rest,
        ...(tipoIdentificacion && {
          tipoIdentificacion: tipoIdentificacion as 'CEDULA' | 'RNC' | 'PASAPORTE' | 'SIN_IDENTIFICACION',
        }),
        email: email === '' ? null : email,
      },
    });
    return ok(updated);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/proveedores/[id]');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const existente = await getProveedor(id, empresaId);
    if (!existente) return err('NOT_FOUND', 'Proveedor no encontrado.', 404);

    await prisma.proveedor.update({ where: { id }, data: { deletedAt: new Date() } });
    return ok({ message: 'Proveedor eliminado.' });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/proveedores/[id]');
  }
}
