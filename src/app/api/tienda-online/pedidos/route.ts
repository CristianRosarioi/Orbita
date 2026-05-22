import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { crearPedidoOnlineSchema } from '@/lib/validations/tienda-online';

const INDUSTRIAS_TIENDA_ONLINE = ['TIENDA_ONLINE'];

async function getTiendaOnlineEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_TIENDA_ONLINE.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaOnlineEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda Online.', 403);

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') ?? undefined;
    const canal = searchParams.get('canal') ?? undefined;
    const q = searchParams.get('q') ?? undefined;
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '30')));
    const skip = (page - 1) * limit;

    const where = {
      empresaId: sesion.empresaActivaId,
      deletedAt: null,
      ...(estado && { estado: estado as never }),
      ...(canal && { canal }),
      ...(q && {
        OR: [
          { clienteNombre: { contains: q, mode: 'insensitive' as const } },
          { clienteTelefono: { contains: q } },
        ],
      }),
    };

    const [total, pedidos] = await Promise.all([
      prisma.pedidoOnline.count({ where }),
      prisma.pedidoOnline.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nombre: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    return ok({
      data: pedidos,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/tienda-online/pedidos');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaOnlineEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda Online.', 403);

    const body = await req.json();
    const parsed = crearPedidoOnlineSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const data = parsed.data;

    if (data.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: { id: data.clienteId, empresaId: sesion.empresaActivaId, deletedAt: null },
      });
      if (!cliente) return err('NOT_FOUND', 'Cliente no encontrado.', 404);
    }

    const subtotalTotal = data.items.reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0,
    );
    const itbisTotal = Math.round(subtotalTotal * 0.18 * 100) / 100;
    const total = Math.round((subtotalTotal + itbisTotal) * 100) / 100;

    const pedido = await prisma.$transaction(async (tx) => {
      const ultimo = await tx.pedidoOnline.findFirst({
        where: { empresaId: sesion.empresaActivaId },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });

      return tx.pedidoOnline.create({
        data: {
          empresaId: sesion.empresaActivaId,
          numero: (ultimo?.numero ?? 0) + 1,
          clienteId: data.clienteId ?? null,
          clienteNombre: data.clienteNombre,
          clienteTelefono: data.clienteTelefono ?? null,
          canal: data.canal,
          subtotal: subtotalTotal,
          itbis: itbisTotal,
          total,
          metodoPago: data.metodoPago ?? null,
          direccionEntrega: data.direccionEntrega ?? null,
          notas: data.notas ?? null,
          creadoPor: userId,
          items: {
            create: data.items.map((item) => ({
              productoId: item.productoId ?? null,
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.cantidad * item.precioUnitario,
            })),
          },
        },
        include: {
          items: true,
          cliente: { select: { id: true, nombre: true } },
        },
      });
    });

    return created(pedido);
  } catch (error) {
    return handleApiError(error, 'POST /api/tienda-online/pedidos');
  }
}
