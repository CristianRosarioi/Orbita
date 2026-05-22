import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { crearCotizacionSchema } from '@/lib/validations/repuestos';

const INDUSTRIAS_REPUESTOS = ['REPUESTOS'];

async function getRepuestosEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_REPUESTOS.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getRepuestosEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Repuestos.', 403);

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') ?? undefined;
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '30')));
    const skip = (page - 1) * limit;

    const where = {
      empresaId: sesion.empresaActivaId,
      ...(estado && { estado: estado as never }),
    };

    const [total, cotizaciones] = await Promise.all([
      prisma.cotizacion.count({ where }),
      prisma.cotizacion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nombre: true } },
          items: { select: { id: true } },
        },
      }),
    ]);

    return ok({
      data: cotizaciones,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/repuestos/cotizaciones');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getRepuestosEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Repuestos.', 403);

    const body = await req.json();
    const parsed = crearCotizacionSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const data = parsed.data;

    if (data.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: { id: data.clienteId, empresaId: sesion.empresaActivaId, deletedAt: null },
      });
      if (!cliente) return err('NOT_FOUND', 'Cliente no encontrado.', 404);
    }

    const cotizacion = await prisma.$transaction(async (tx) => {
      const ultimo = await tx.cotizacion.findFirst({
        where: { empresaId: sesion.empresaActivaId },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });

      const itemsCalculados = data.items.map((item) => {
        const subtotal = round2(item.cantidad * item.precioUnitario);
        const itbisMonto = round2(subtotal * (item.itbisPorcentaje / 100));
        const total = round2(subtotal + itbisMonto);
        return { ...item, subtotal, itbisMonto, total };
      });

      const subtotal = round2(itemsCalculados.reduce((s, i) => s + i.subtotal, 0));
      const itbis = round2(itemsCalculados.reduce((s, i) => s + i.itbisMonto, 0));
      const total = round2(itemsCalculados.reduce((s, i) => s + i.total, 0));

      return tx.cotizacion.create({
        data: {
          empresaId: sesion.empresaActivaId,
          numero: (ultimo?.numero ?? 0) + 1,
          clienteId: data.clienteId ?? null,
          clienteNombre: data.clienteNombre,
          clienteTelefono: data.clienteTelefono ?? null,
          vehiculoMarca: data.vehiculoMarca ?? null,
          vehiculoModelo: data.vehiculoModelo ?? null,
          vehiculoAnio: data.vehiculoAnio ?? null,
          vehiculoPlaca: data.vehiculoPlaca ?? null,
          notas: data.notas ?? null,
          validaHasta: data.validaHasta ? new Date(data.validaHasta) : null,
          subtotal,
          itbis,
          total,
          creadoPor: userId,
          items: {
            create: itemsCalculados.map((item) => ({
              repuestoId: item.repuestoId ?? null,
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              itbisPorcentaje: item.itbisPorcentaje,
              itbisMonto: item.itbisMonto,
              subtotal: item.subtotal,
              total: item.total,
            })),
          },
        },
        include: { items: true },
      });
    });

    return created(cotizacion);
  } catch (error) {
    return handleApiError(error, 'POST /api/repuestos/cotizaciones');
  }
}
