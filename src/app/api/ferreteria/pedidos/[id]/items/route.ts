import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { AddItemPedidoSchema } from '@/lib/validations/ferreteria';

const INDUSTRIAS_FERRETERIA = ['FERRETERIA', 'MATERIALES', 'PINTURAS'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return err('VALIDATION_ERROR', 'Solo se pueden agregar ítems a pedidos en borrador.', 422);

    const body = await req.json();
    const parsed = AddItemPedidoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const subtotal =
      Math.round(parsed.data.cantidad * parsed.data.precioUnitario * 100) / 100;

    const item = await prisma.$transaction(async (tx) => {
      const nuevoItem = await tx.itemPedidoProveedor.create({
        data: {
          pedidoId: id,
          productoId: parsed.data.productoId,
          descripcion: parsed.data.descripcion,
          unidadMedida: parsed.data.unidadMedida,
          cantidad: parsed.data.cantidad,
          precioUnitario: parsed.data.precioUnitario,
          subtotal,
        },
        include: { producto: { select: { id: true, nombre: true } } },
      });

      const todos = await tx.itemPedidoProveedor.findMany({
        where: { pedidoId: id },
        select: { subtotal: true },
      });
      const total = todos.reduce((s, i) => s + Number(i.subtotal), 0);

      await tx.pedidoProveedor.update({
        where: { id },
        data: { total },
      });

      return nuevoItem;
    });

    return created(item);
  } catch (error) {
    return handleApiError(error, 'POST /api/ferreteria/pedidos/[id]/items');
  }
}
