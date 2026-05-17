import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateMesaSchema } from '@/lib/validations/restaurante';

const INDUSTRIAS_RESTAURANTE = ['RESTAURANTE'];

async function getRestauranteEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_RESTAURANTE.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getRestauranteEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const mesas = await prisma.mesa.findMany({
      where: { empresaId: sesion.empresaActivaId, activa: true },
      orderBy: { numero: 'asc' },
      include: {
        comandas: {
          where: { estado: 'ABIERTA' },
          select: { id: true, numero: true },
          take: 1,
        },
      },
    });

    return ok(mesas);
  } catch (error) {
    return handleApiError(error, 'GET /api/restaurante/mesas');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getRestauranteEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const body = await req.json();
    const parsed = CreateMesaSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const { numero, nombre, capacidad } = parsed.data;

    const existe = await prisma.mesa.findFirst({
      where: { empresaId: sesion.empresaActivaId, numero, activa: true },
    });
    if (existe) return err('CONFLICT', `Ya existe una mesa con el número ${numero}.`, 409);

    const mesa = await prisma.mesa.create({
      data: {
        empresaId: sesion.empresaActivaId,
        numero,
        nombre,
        capacidad,
      },
    });

    return created(mesa);
  } catch (error) {
    return handleApiError(error, 'POST /api/restaurante/mesas');
  }
}
