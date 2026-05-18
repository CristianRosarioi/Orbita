import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateOrdenCompraSchema } from '@/lib/validations/compras';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { id } = await params;
    const orden = await prisma.ordenCompra.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
      include: {
        proveedor: { select: { id: true, nombre: true, nombreComercial: true, identificacion: true } },
        items: { include: { producto: { select: { id: true, nombre: true, sku: true } } } },
      },
    });

    if (!orden) return err('NOT_FOUND', 'Orden de compra no encontrada.', 404);
    return ok(orden);
  } catch (error) {
    return handleApiError(error, 'GET /api/compras/ordenes/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { id } = await params;
    const orden = await prisma.ordenCompra.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!orden) return err('NOT_FOUND', 'Orden de compra no encontrada.', 404);
    if (orden.estado !== 'BORRADOR') return err('VALIDATION_ERROR', 'Solo se pueden editar órdenes en borrador.', 422);

    const body = await req.json();
    const parsed = UpdateOrdenCompraSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizada = await prisma.ordenCompra.update({
      where: { id },
      data: {
        notas: parsed.data.notas,
        fechaEsperada: parsed.data.fechaEsperada ? new Date(parsed.data.fechaEsperada) : undefined,
      },
      include: {
        proveedor: { select: { id: true, nombre: true } },
        items: true,
      },
    });

    return ok(actualizada);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/compras/ordenes/[id]');
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

    const orden = await prisma.ordenCompra.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!orden) return err('NOT_FOUND', 'Orden de compra no encontrada.', 404);
    if (orden.estado !== 'BORRADOR') return err('VALIDATION_ERROR', 'Solo se pueden eliminar órdenes en borrador.', 422);

    await prisma.ordenCompra.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/compras/ordenes/[id]');
  }
}
