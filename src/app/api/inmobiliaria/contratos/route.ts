import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { CrearContratoSchema } from '@/lib/validations/inmobiliaria';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const propiedadId = searchParams.get('propiedadId');
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const skip = (page - 1) * limit;

    const where = {
      empresaId,
      ...(estado && { estado: estado as never }),
      ...(propiedadId && { propiedadId }),
    };

    const [contratos, total] = await Promise.all([
      prisma.contratoAlquiler.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          propiedad: { select: { codigo: true, nombre: true, tipo: true } },
          cliente: { select: { nombre: true } },
        },
      }),
      prisma.contratoAlquiler.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: contratos,
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

    const parsed = CrearContratoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const { data } = parsed;

    const propiedad = await prisma.propiedad.findFirst({
      where: { id: data.propiedadId, empresaId, deletedAt: null },
    });
    if (!propiedad) return err('NOT_FOUND', 'Propiedad no encontrada.', 404);

    if (propiedad.estado === 'ALQUILADA') {
      return err('CONFLICT', 'No se puede crear un contrato para una propiedad ya alquilada.', 409);
    }

    const contrato = await prisma.$transaction(async (tx) => {
      const c = await tx.contratoAlquiler.create({
        data: { ...data, empresaId, creadoPor: userId },
        include: {
          propiedad: { select: { codigo: true, nombre: true } },
        },
      });
      await tx.propiedad.update({
        where: { id: data.propiedadId },
        data: { estado: 'ALQUILADA' },
      });
      return c;
    });

    return ok(contrato, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
