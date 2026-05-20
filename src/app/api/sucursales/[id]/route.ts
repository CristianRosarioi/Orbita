import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateSucursalSchema } from '@/lib/validations/sucursales';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('UNAUTHORIZED', 'Selecciona una empresa activa.', 401);

    const { id } = await params;

    const sucursal = await prisma.sucursal.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
      include: {
        stockSucursal: {
          include: { producto: { select: { id: true, nombre: true, sku: true } } },
          orderBy: { producto: { nombre: 'asc' } },
        },
      },
    });

    if (!sucursal) return err('NOT_FOUND', 'Sucursal no encontrada.', 404);

    return ok(sucursal);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('UNAUTHORIZED', 'Selecciona una empresa activa.', 401);

    const { id } = await params;

    const sucursal = await prisma.sucursal.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!sucursal) return err('NOT_FOUND', 'Sucursal no encontrada.', 404);

    const body = await req.json();
    const parsed = UpdateSucursalSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos.', 400);

    if (parsed.data.codigo && parsed.data.codigo !== sucursal.codigo) {
      const existe = await prisma.sucursal.findFirst({
        where: {
          empresaId: sesion.empresaActivaId,
          codigo: parsed.data.codigo,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existe) return err('VALIDATION_ERROR', `Ya existe una sucursal con ese código.`, 409);
    }

    const actualizada = await prisma.sucursal.update({
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

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('UNAUTHORIZED', 'Selecciona una empresa activa.', 401);

    const { id } = await params;

    const sucursal = await prisma.sucursal.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!sucursal) return err('NOT_FOUND', 'Sucursal no encontrada.', 404);
    if (sucursal.esPrincipal)
      return err('FORBIDDEN', 'No se puede eliminar la sucursal principal.', 403);

    await prisma.sucursal.update({
      where: { id },
      data: { activa: false, deletedAt: new Date() },
    });

    return ok({ message: 'Sucursal desactivada correctamente.' });
  } catch (e) {
    return handleApiError(e);
  }
}
