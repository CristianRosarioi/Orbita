import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdatePedidoSchema } from '@/lib/validations/ferreteria';

const INDUSTRIAS_FERRETERIA = ['FERRETERIA', 'MATERIALES', 'PINTURAS'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_FERRETERIA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para ferreterías.', 403);

    const { id } = await params;
    const pedido = await prisma.pedidoProveedor.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
      include: {
        proveedor: { select: { id: true, nombre: true, telefono: true, email: true } },
        items: {
          include: { producto: { select: { id: true, nombre: true, sku: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!pedido) return err('NOT_FOUND', 'Pedido no encontrado.', 404);
    return ok(pedido);
  } catch (error) {
    return handleApiError(error, 'GET /api/ferreteria/pedidos/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_FERRETERIA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para ferreterías.', 403);

    const { id } = await params;
    const pedido = await prisma.pedidoProveedor.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!pedido) return err('NOT_FOUND', 'Pedido no encontrado.', 404);

    if (pedido.estado === 'CANCELADO' || pedido.estado === 'RECIBIDO')
      return err('VALIDATION_ERROR', 'No se puede modificar un pedido cerrado.', 422);

    const body = await req.json();
    const parsed = UpdatePedidoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizado = await prisma.pedidoProveedor.update({
      where: { id },
      data: {
        ...parsed.data,
        fechaEntrega: parsed.data.fechaEntrega ? new Date(parsed.data.fechaEntrega) : undefined,
      },
      include: {
        proveedor: { select: { id: true, nombre: true } },
        items: true,
      },
    });

    return ok(actualizado);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/ferreteria/pedidos/[id]');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_FERRETERIA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para ferreterías.', 403);

    const { id } = await params;
    const pedido = await prisma.pedidoProveedor.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!pedido) return err('NOT_FOUND', 'Pedido no encontrado.', 404);

    if (pedido.estado !== 'BORRADOR')
      return err('VALIDATION_ERROR', 'Solo se pueden eliminar pedidos en borrador.', 422);

    await prisma.pedidoProveedor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return ok({ id });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/ferreteria/pedidos/[id]');
  }
}
