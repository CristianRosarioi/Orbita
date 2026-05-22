import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { crearDevolucionSchema } from '@/lib/validations/tienda-ropa';

const INDUSTRIAS_TIENDA_ROPA = ['TIENDA_ROPA'];

async function getTiendaRopaEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_TIENDA_ROPA.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaRopaEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda de Ropa.', 403);

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') ?? undefined;
    const tipo = searchParams.get('tipo') ?? undefined;
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '30')));
    const skip = (page - 1) * limit;

    const where = {
      empresaId: sesion.empresaActivaId,
      ...(estado && { estado: estado as never }),
      ...(tipo && { tipo }),
    };

    const [total, devoluciones] = await Promise.all([
      prisma.devolucion.count({ where }),
      prisma.devolucion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          factura: { select: { id: true, numero: true } },
          cliente: { select: { id: true, nombre: true } },
        },
      }),
    ]);

    return ok({
      data: devoluciones,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/tienda-ropa/devoluciones');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaRopaEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda de Ropa.', 403);

    const body = await req.json();
    const parsed = crearDevolucionSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const data = parsed.data;

    const factura = await prisma.factura.findFirst({
      where: { id: data.facturaId, empresaId: sesion.empresaActivaId },
    });
    if (!factura) return err('NOT_FOUND', 'Factura no encontrada.', 404);
    if (factura.estado === 'ANULADA')
      return err('CONFLICT', 'No se puede hacer una devolución sobre una factura anulada.', 409);

    if (data.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: { id: data.clienteId, empresaId: sesion.empresaActivaId, deletedAt: null },
      });
      if (!cliente) return err('NOT_FOUND', 'Cliente no encontrado.', 404);
    }

    const devolucion = await prisma.devolucion.create({
      data: {
        empresaId: sesion.empresaActivaId,
        facturaId: data.facturaId,
        clienteId: data.clienteId ?? null,
        motivo: data.motivo,
        tipo: data.tipo,
        montoCredito: data.montoCredito ?? null,
        notas: data.notas ?? null,
        creadoPor: userId,
      },
      include: {
        factura: { select: { id: true, numero: true } },
        cliente: { select: { id: true, nombre: true } },
      },
    });

    return created(devolucion);
  } catch (error) {
    return handleApiError(error, 'POST /api/tienda-ropa/devoluciones');
  }
}
