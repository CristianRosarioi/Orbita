import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { CrearReparacionSchema } from '@/lib/validations/joyeria';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const skip = (page - 1) * limit;

    const where = {
      empresaId,
      ...(estado && { estado }),
    };

    const [reparaciones, total] = await Promise.all([
      prisma.reparacionJoya.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          pieza: { select: { codigo: true, nombre: true } },
          cliente: { select: { nombre: true, telefono: true } },
        },
      }),
      prisma.reparacionJoya.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reparaciones,
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

    const parsed = CrearReparacionSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const reparacion = await prisma.$transaction(async (tx) => {
      const r = await tx.reparacionJoya.create({
        data: { ...parsed.data, empresaId, creadoPor: userId },
      });
      if (parsed.data.piezaId) {
        await tx.piezaJoya.update({
          where: { id: parsed.data.piezaId },
          data: { estado: 'EN_REPARACION' },
        });
      }
      return r;
    });

    return ok(reparacion, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
