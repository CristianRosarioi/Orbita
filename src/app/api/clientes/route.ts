import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { CreateClienteSchema, ClienteFiltrosSchema } from '@/lib/validations/clientes';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const { searchParams } = req.nextUrl;

    const filtros = ClienteFiltrosSchema.safeParse({
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
      search: searchParams.get('search') ?? undefined,
      tipo: searchParams.get('tipo') ?? undefined,
      activo: searchParams.get('activo') ?? undefined,
    });

    if (!filtros.success) return err('VALIDATION_ERROR', 'Parámetros de búsqueda inválidos.', 422);

    const { page, limit, search, tipo, activo } = filtros.data;
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
      ...(tipo && { tipo: tipo as 'PERSONA' | 'EMPRESA' }),
      ...(activo !== undefined && activo !== '' && { activo: activo === 'true' }),
    };

    const [items, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip,
        take: limit,
      }),
      prisma.cliente.count({ where }),
    ]);

    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error, 'GET /api/clientes');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = CreateClienteSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const data = parsed.data;
    const cliente = await prisma.cliente.create({
      data: {
        ...data,
        empresaId,
        tipo: data.tipo as 'PERSONA' | 'EMPRESA',
        tipoIdentificacion: data.tipoIdentificacion as 'CEDULA' | 'RNC' | 'PASAPORTE' | 'SIN_IDENTIFICACION',
        limiteCredito: data.limiteCredito,
        email: data.email || null,
      },
    });

    return ok(cliente, 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/clientes');
  }
}
