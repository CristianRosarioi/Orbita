import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { CreateUnidadMedidaSchema } from '@/lib/validations/unidades-medida';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const unidades = await prisma.unidadMedida.findMany({
      where: { empresaId, deletedAt: null },
      orderBy: [{ esBase: 'desc' }, { nombre: 'asc' }],
    });

    return ok(unidades);
  } catch (error) {
    return handleApiError(error, 'GET /api/unidades-medida');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = CreateUnidadMedidaSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const existente = await prisma.unidadMedida.findFirst({
      where: { empresaId, abreviatura: { equals: parsed.data.abreviatura, mode: 'insensitive' }, deletedAt: null },
    });
    if (existente) return err('CONFLICT', 'Ya existe una unidad con esa abreviatura.', 409);

    const unidad = await prisma.unidadMedida.create({
      data: { ...parsed.data, empresaId, esBase: false },
    });

    return ok(unidad, 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/unidades-medida');
  }
}
