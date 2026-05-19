import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreatePedidoSchema } from '@/lib/validations/ferreteria';

const INDUSTRIAS_FERRETERIA = ['FERRETERIA', 'MATERIALES', 'PINTURAS'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_FERRETERIA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para ferreterías.', 403);

    const { searchParams } = req.nextUrl;
    const estado = searchParams.get('estado');
    const proveedorId = searchParams.get('proveedorId');

    const pedidos = await prisma.pedidoProveedor.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        deletedAt: null,
        ...(estado ? { estado: estado as never } : {}),
        ...(proveedorId ? { proveedorId } : {}),
      },
      include: {
        proveedor: { select: { id: true, nombre: true } },
        _count: { select: { items: true } },
      },
      orderBy: { fechaPedido: 'desc' },
    });

    return ok(pedidos);
  } catch (error) {
    return handleApiError(error, 'GET /api/ferreteria/pedidos');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_FERRETERIA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para ferreterías.', 403);

    const body = await req.json();
    const parsed = CreatePedidoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const proveedor = await prisma.proveedor.findFirst({
      where: { id: parsed.data.proveedorId, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!proveedor) return err('NOT_FOUND', 'Proveedor no encontrado.', 404);

    const pedido = await prisma.$transaction(async (tx) => {
      const ultimo = await tx.pedidoProveedor.findFirst({
        where: { empresaId: sesion.empresaActivaId },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const numero = (ultimo?.numero ?? 0) + 1;

      return tx.pedidoProveedor.create({
        data: {
          empresaId: sesion.empresaActivaId,
          proveedorId: parsed.data.proveedorId,
          numero,
          notas: parsed.data.notas,
          fechaEntrega: parsed.data.fechaEntrega ? new Date(parsed.data.fechaEntrega) : undefined,
          creadoPor: sesion.usuarioId,
        },
        include: {
          proveedor: { select: { id: true, nombre: true } },
        },
      });
    });

    return created(pedido);
  } catch (error) {
    return handleApiError(error, 'POST /api/ferreteria/pedidos');
  }
}
