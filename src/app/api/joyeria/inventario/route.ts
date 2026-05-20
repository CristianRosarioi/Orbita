import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { CrearPiezaSchema } from '@/lib/validations/joyeria';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const { searchParams } = new URL(req.url);
    const material = searchParams.get('material');
    const estado = searchParams.get('estado');
    const busqueda = searchParams.get('q');
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 24)));
    const skip = (page - 1) * limit;

    const where = {
      empresaId,
      deletedAt: null,
      ...(material && { material: material as never }),
      ...(estado && { estado: estado as never }),
      ...(busqueda && {
        OR: [
          { nombre: { contains: busqueda, mode: 'insensitive' as const } },
          { codigo: { contains: busqueda, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [piezas, total] = await Promise.all([
      prisma.piezaJoya.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          cliente: { select: { nombre: true } },
        },
      }),
      prisma.piezaJoya.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: piezas,
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

    const parsed = CrearPiezaSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const existe = await prisma.piezaJoya.findUnique({
      where: { empresaId_codigo: { empresaId, codigo: parsed.data.codigo } },
    });
    if (existe) return err('DUPLICATE', `Ya existe una pieza con el código ${parsed.data.codigo}.`, 409);

    const pieza = await prisma.piezaJoya.create({
      data: { ...parsed.data, empresaId, creadoPor: userId },
    });

    return ok(pieza, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
