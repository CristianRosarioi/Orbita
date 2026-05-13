import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { CreateCategoriaSchema } from '@/lib/validations/categorias';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const categorias = await prisma.categoria.findMany({
      where: { empresaId, deletedAt: null },
      include: { _count: { select: { productos: { where: { deletedAt: null } } } } },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });

    return ok(categorias);
  } catch (error) {
    return handleApiError(error, 'GET /api/categorias');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = CreateCategoriaSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const existente = await prisma.categoria.findFirst({
      where: { empresaId, nombre: { equals: parsed.data.nombre, mode: 'insensitive' }, deletedAt: null },
    });
    if (existente) return err('CONFLICT', 'Ya existe una categoría con ese nombre.', 409);

    const categoria = await prisma.categoria.create({
      data: { ...parsed.data, empresaId },
    });

    return ok(categoria, 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/categorias');
  }
}
