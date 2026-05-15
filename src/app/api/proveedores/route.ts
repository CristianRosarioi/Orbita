import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { CreateProveedorSchema, ProveedorFiltrosSchema } from '@/lib/validations/proveedores';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { searchParams } = req.nextUrl;

    const filtros = ProveedorFiltrosSchema.safeParse({
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
      search: searchParams.get('search') ?? undefined,
      activo: searchParams.get('activo') ?? undefined,
    });

    if (!filtros.success) return err('VALIDATION_ERROR', 'Parámetros inválidos.', 422);

    const { page, limit, search, activo } = filtros.data;
    const skip = (page - 1) * limit;

    const where = {
      empresaId,
      deletedAt: null,
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' as const } },
          { identificacion: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(activo !== undefined && activo !== '' && { activo: activo === 'true' }),
    };

    const [items, total] = await Promise.all([
      prisma.proveedor.findMany({ where, orderBy: { nombre: 'asc' }, skip, take: limit }),
      prisma.proveedor.count({ where }),
    ]);

    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error, 'GET /api/proveedores');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = CreateProveedorSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        ...parsed.data,
        empresaId,
        tipoIdentificacion: parsed.data.tipoIdentificacion as
          | 'CEDULA'
          | 'RNC'
          | 'PASAPORTE'
          | 'SIN_IDENTIFICACION',
        email: parsed.data.email || null,
      },
    });

    return ok(proveedor, 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/proveedores');
  }
}
