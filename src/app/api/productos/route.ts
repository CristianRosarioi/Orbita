import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { CreateProductoSchema, ProductoFiltrosSchema } from '@/lib/validations/productos';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { searchParams } = req.nextUrl;

    const filtros = ProductoFiltrosSchema.safeParse({
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
      search: searchParams.get('search') ?? undefined,
      categoriaId: searchParams.get('categoriaId') ?? undefined,
      tipo: searchParams.get('tipo') ?? undefined,
      activo: searchParams.get('activo') ?? undefined,
    });

    if (!filtros.success) return err('VALIDATION_ERROR', 'Parámetros inválidos.', 422);

    const { page, limit, search, categoriaId, tipo, activo } = filtros.data;
    const skip = (page - 1) * limit;

    const where = {
      empresaId,
      deletedAt: null,
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
          { codigoBarras: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(categoriaId && { categoriaId }),
      ...(tipo && { tipo: tipo as 'BIEN' | 'SERVICIO' }),
      ...(activo !== undefined && activo !== '' && { activo: activo === 'true' }),
    };

    const [items, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: { categoria: true, unidadMedida: true },
        orderBy: { nombre: 'asc' },
        skip,
        take: limit,
      }),
      prisma.producto.count({ where }),
    ]);

    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error, 'GET /api/productos');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = CreateProductoSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const { precioCredito, precioMayorista, precioEspecial, ...productoData } = parsed.data;

    const producto = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.producto.create({
        data: {
          ...productoData,
          empresaId,
          tipo: productoData.tipo as 'BIEN' | 'SERVICIO',
          imagenUrl: productoData.imagenUrl || null,
          categoriaId: productoData.categoriaId ?? null,
        },
      });

      const preciosList = [
        precioCredito !== undefined ? { nivel: 'CREDITO' as const, precio: precioCredito } : null,
        precioMayorista !== undefined
          ? { nivel: 'MAYORISTA' as const, precio: precioMayorista }
          : null,
        precioEspecial !== undefined
          ? { nivel: 'ESPECIAL' as const, precio: precioEspecial }
          : null,
      ].filter(
        (p): p is { nivel: 'CREDITO' | 'MAYORISTA' | 'ESPECIAL'; precio: number } => p !== null,
      );

      if (preciosList.length > 0) {
        await tx.precioProducto.createMany({
          data: preciosList.map((p) => ({
            productoId: nuevo.id,
            nivel: p.nivel,
            precio: p.precio,
          })),
        });
      }

      return tx.producto.findUniqueOrThrow({
        where: { id: nuevo.id },
        include: { categoria: true, unidadMedida: true, precios: true },
      });
    });

    return ok(producto, 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/productos');
  }
}
