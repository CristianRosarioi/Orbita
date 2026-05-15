import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { CreateFacturaSchema, FacturaFiltrosSchema } from '@/lib/validations/facturas';
import { calcularTotalesFactura, generarNumeroFactura } from '@/lib/facturacion';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const { searchParams } = req.nextUrl;

    const filtros = FacturaFiltrosSchema.safeParse({
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
      search: searchParams.get('search') ?? undefined,
      estado: searchParams.get('estado') ?? undefined,
      clienteId: searchParams.get('clienteId') ?? undefined,
      desde: searchParams.get('desde') ?? undefined,
      hasta: searchParams.get('hasta') ?? undefined,
    });

    if (!filtros.success) return err('VALIDATION_ERROR', 'Parámetros de búsqueda inválidos.', 422);

    const { page, limit, search, estado, clienteId, desde, hasta } = filtros.data;
    const skip = (page - 1) * limit;

    const where: Prisma.FacturaWhereInput = {
      empresaId,
      deletedAt: null,
      ...(estado && { estado: estado as never }),
      ...(clienteId && { clienteId }),
      ...(desde || hasta
        ? {
            fechaEmision: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta ? { lte: new Date(hasta) } : {}),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { numero: { contains: search, mode: 'insensitive' as const } },
          { clienteNombre: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.factura.findMany({
        where,
        orderBy: { fechaEmision: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          numero: true,
          clienteNombre: true,
          fechaEmision: true,
          metodoPago: true,
          total: true,
          estado: true,
          saldo: true,
        },
      }),
      prisma.factura.count({ where }),
    ]);

    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error, 'GET /api/facturas');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = CreateFacturaSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const data = parsed.data;
    const totales = calcularTotalesFactura(
      data.items.map((item) => ({
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        itbisPorcentaje: item.itbisPorcentaje,
        descuento: item.descuento,
      })),
      data.descuento ?? 0,
    );

    const factura = await prisma.$transaction(async (tx) => {
      const { numero, numeroInt, anio } = await generarNumeroFactura(empresaId, tx);

      return tx.factura.create({
        data: {
          empresaId,
          sucursalId: data.sucursalId ?? null,
          numero,
          numeroInt,
          anio,
          clienteId: data.clienteId ?? null,
          clienteNombre: data.clienteNombre,
          clienteIdentificacion: data.clienteIdentificacion ?? null,
          estado: 'BORRADOR',
          metodoPago: data.metodoPago as never,
          subtotal: totales.subtotal,
          itbis: totales.itbis,
          descuento: totales.descuento,
          total: totales.total,
          totalPagado: 0,
          saldo: totales.total,
          notas: data.notas ?? null,
          fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
          creadoPor: userId,
          items: {
            create: data.items.map((item, idx) => ({
              productoId: item.productoId ?? null,
              productoNombre: item.productoNombre,
              productoSku: item.productoSku ?? null,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              itbisPorcentaje: item.itbisPorcentaje,
              itbisMonto: totales.items[idx]?.itbisMonto ?? 0,
              descuento: item.descuento,
              subtotal: totales.items[idx]?.subtotal ?? 0,
              total: totales.items[idx]?.total ?? 0,
            })),
          },
        },
        include: { items: true },
      });
    });

    return ok(factura, 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/facturas');
  }
}
