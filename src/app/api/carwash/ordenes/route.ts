import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { crearOrdenCarwashSchema } from '@/lib/validations/carwash';

const INDUSTRIAS_CARWASH = ['CARWASH'];

async function getCarwashEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_CARWASH.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCarwashEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Carwash.', 403);

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') ?? undefined;
    const placa = searchParams.get('placa') ?? undefined;
    const fecha = searchParams.get('fecha') ?? undefined;
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '30')));
    const skip = (page - 1) * limit;

    const where = {
      empresaId: sesion.empresaActivaId,
      deletedAt: null,
      ...(estado && { estado: estado as never }),
      ...(placa && { vehiculoPlaca: { contains: placa.toUpperCase() } }),
      ...(fecha && {
        createdAt: {
          gte: new Date(`${fecha}T00:00:00`),
          lte: new Date(`${fecha}T23:59:59`),
        },
      }),
    };

    const [total, ordenes] = await Promise.all([
      prisma.ordenCarwash.count({ where }),
      prisma.ordenCarwash.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nombre: true, telefono: true } },
        },
      }),
    ]);

    return ok({ data: ordenes, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error, 'GET /api/carwash/ordenes');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCarwashEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Carwash.', 403);

    const body = await req.json();
    const parsed = crearOrdenCarwashSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const data = parsed.data;

    if (data.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: { id: data.clienteId, empresaId: sesion.empresaActivaId, deletedAt: null },
      });
      if (!cliente) return err('NOT_FOUND', 'Cliente no encontrado.', 404);
    }

    const orden = await prisma.$transaction(async (tx) => {
      const ultimo = await tx.ordenCarwash.findFirst({
        where: { empresaId: sesion.empresaActivaId },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });

      return tx.ordenCarwash.create({
        data: {
          empresaId: sesion.empresaActivaId,
          numero: (ultimo?.numero ?? 0) + 1,
          clienteId: data.clienteId ?? null,
          clienteNombre: data.clienteNombre,
          clienteTelefono: data.clienteTelefono ?? null,
          vehiculoPlaca: data.vehiculoPlaca,
          vehiculoMarca: data.vehiculoMarca ?? null,
          vehiculoModelo: data.vehiculoModelo ?? null,
          vehiculoColor: data.vehiculoColor ?? null,
          tipoServicio: data.tipoServicio,
          duracionMin: data.duracionMin,
          precio: data.precio,
          empleadoAsignado: data.empleadoAsignado ?? null,
          notas: data.notas ?? null,
          creadoPor: userId,
        },
        include: {
          cliente: { select: { id: true, nombre: true } },
        },
      });
    });

    return created(orden);
  } catch (error) {
    return handleApiError(error, 'POST /api/carwash/ordenes');
  }
}
