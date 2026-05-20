import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { CrearPropiedadSchema } from '@/lib/validations/inmobiliaria';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const skip = (page - 1) * limit;

    const where = {
      empresaId,
      deletedAt: null,
      ...(tipo && { tipo: tipo as never }),
      ...(estado && { estado: estado as never }),
    };

    const [propiedades, total] = await Promise.all([
      prisma.propiedad.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          codigo: true,
          nombre: true,
          tipo: true,
          estado: true,
          ciudad: true,
          sector: true,
          habitaciones: true,
          banos: true,
          metrosCuadrados: true,
          precioAlquiler: true,
          precioVenta: true,
          activa: true,
          createdAt: true,
          _count: { select: { contratos: true } },
        },
      }),
      prisma.propiedad.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: propiedades,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'Formato inválido.', 400);

    const parsed = CrearPropiedadSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const { data } = parsed;

    const existe = await prisma.propiedad.findUnique({
      where: { empresaId_codigo: { empresaId, codigo: data.codigo } },
    });
    if (existe) return err('DUPLICATE', `Ya existe una propiedad con el código ${data.codigo}.`, 409);

    const propiedad = await prisma.propiedad.create({
      data: { ...data, empresaId, creadoPor: userId },
    });

    return ok(propiedad, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
