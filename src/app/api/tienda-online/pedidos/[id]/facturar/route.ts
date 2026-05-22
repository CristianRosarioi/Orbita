import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { generarNumeroFactura } from '@/lib/facturacion';
import { facturarPedidoOnlineSchema } from '@/lib/validations/tienda-online';

const INDUSTRIAS_TIENDA_ONLINE = ['TIENDA_ONLINE'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_TIENDA_ONLINE.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda Online.', 403);

    const { id } = await params;

    const pedido = await prisma.pedidoOnline.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
      include: { items: true },
    });
    if (!pedido) return err('NOT_FOUND', 'Pedido no encontrado.', 404);
    if (pedido.estado === 'CANCELADO')
      return err('CONFLICT', 'No se puede facturar un pedido cancelado.', 409);
    if (pedido.facturaId) return err('CONFLICT', 'Este pedido ya fue facturado.', 409);

    const body = await req.json();
    const parsed = facturarPedidoOnlineSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const subtotal = Number(pedido.subtotal);
    const itbis = Number(pedido.itbis);
    const total = Number(pedido.total);

    const factura = await prisma.$transaction(async (tx) => {
      const { numero, numeroInt, anio } = await generarNumeroFactura(
        sesion.empresaActivaId,
        tx as never,
      );

      const nuevaFactura = await tx.factura.create({
        data: {
          empresaId: sesion.empresaActivaId,
          numero,
          numeroInt,
          anio,
          clienteId: pedido.clienteId,
          clienteNombre: pedido.clienteNombre,
          metodoPago: parsed.data.metodoPago,
          estado: parsed.data.metodoPago === 'CREDITO' ? 'EMITIDA' : 'PAGADA',
          subtotal,
          itbis,
          descuento: 0,
          total,
          saldo: parsed.data.metodoPago === 'CREDITO' ? total : 0,
          creadoPor: sesion.usuarioId,
          items: {
            create: pedido.items.map((item) => {
              const itemSubtotal = Number(item.subtotal);
              const itemItbis = Math.round(itemSubtotal * 0.18 * 100) / 100;
              return {
                productoId: item.productoId ?? undefined,
                productoNombre: item.descripcion,
                cantidad: item.cantidad,
                precioUnitario: Number(item.precioUnitario),
                itbisPorcentaje: 18,
                itbisMonto: itemItbis,
                descuento: 0,
                subtotal: itemSubtotal,
                total: itemSubtotal,
              };
            }),
          },
        },
      });

      await tx.pedidoOnline.update({
        where: { id },
        data: { facturaId: nuevaFactura.id, estado: 'ENTREGADO' },
      });

      return nuevaFactura;
    });

    return ok(factura);
  } catch (error) {
    return handleApiError(error, 'POST /api/tienda-online/pedidos/[id]/facturar');
  }
}
