import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { actualizarPedidoOnlineSchema } from '@/lib/validations/tienda-online';

const INDUSTRIAS_TIENDA_ONLINE = ['TIENDA_ONLINE'];

async function getTiendaOnlineEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_TIENDA_ONLINE.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaOnlineEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda Online.', 403);

    const { id } = await params;

    const pedido = await prisma.pedidoOnline.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
      include: {
        items: {
          include: { producto: { select: { id: true, nombre: true } } },
        },
        cliente: { select: { id: true, nombre: true, telefono: true } },
      },
    });
    if (!pedido) return err('NOT_FOUND', 'Pedido no encontrado.', 404);

    return ok(pedido);
  } catch (error) {
    return handleApiError(error, 'GET /api/tienda-online/pedidos/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaOnlineEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda Online.', 403);

    const { id } = await params;

    const pedido = await prisma.pedidoOnline.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!pedido) return err('NOT_FOUND', 'Pedido no encontrado.', 404);
    if (pedido.estado === 'ENTREGADO')
      return err('CONFLICT', 'No se puede modificar un pedido ya entregado.', 409);
    if (pedido.estado === 'CANCELADO')
      return err('CONFLICT', 'No se puede modificar un pedido cancelado.', 409);

    const body = await req.json();
    const parsed = actualizarPedidoOnlineSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizado = await prisma.pedidoOnline.update({
      where: { id },
      data: parsed.data,
      include: {
        items: true,
        cliente: { select: { id: true, nombre: true } },
      },
    });

    return ok(actualizado);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/tienda-online/pedidos/[id]');
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaOnlineEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda Online.', 403);

    const { id } = await params;

    const pedido = await prisma.pedidoOnline.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!pedido) return err('NOT_FOUND', 'Pedido no encontrado.', 404);
    if (pedido.facturaId)
      return err('CONFLICT', 'No se puede eliminar un pedido que ya fue facturado.', 409);

    await prisma.pedidoOnline.update({
      where: { id },
      data: { deletedAt: new Date(), estado: 'CANCELADO' },
    });

    return ok({ mensaje: 'Pedido cancelado correctamente.' });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/tienda-online/pedidos/[id]');
  }
}
