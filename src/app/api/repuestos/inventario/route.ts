import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { crearRepuestoSchema } from '@/lib/validations/repuestos';

const INDUSTRIAS_REPUESTOS = ['REPUESTOS'];

async function getRepuestosEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_REPUESTOS.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getRepuestosEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Repuestos.', 403);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') ?? undefined;
    const soloStockBajo = searchParams.get('stockBajo') === 'true';
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '30')));
    const skip = (page - 1) * limit;

    const where = {
      empresaId: sesion.empresaActivaId,
      deletedAt: null,
      activo: true,
      ...(q && {
        OR: [
          { codigo: { contains: q.toUpperCase() } },
          { nombre: { contains: q, mode: 'insensitive' as const } },
          { marca: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [total, repuestos] = await Promise.all([
      prisma.repuesto.count({ where }),
      prisma.repuesto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
      }),
    ]);

    const data = soloStockBajo
      ? repuestos.filter((r) => r.stock <= r.stockMinimo)
      : repuestos;

    return ok({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error, 'GET /api/repuestos/inventario');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getRepuestosEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Repuestos.', 403);

    const body = await req.json();
    const parsed = crearRepuestoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const existe = await prisma.repuesto.findFirst({
      where: { empresaId: sesion.empresaActivaId, codigo: parsed.data.codigo, deletedAt: null },
    });
    if (existe) return err('CONFLICT', `Ya existe un repuesto con el código ${parsed.data.codigo}.`, 409);

    const repuesto = await prisma.repuesto.create({
      data: {
        empresaId: sesion.empresaActivaId,
        ...parsed.data,
        creadoPor: userId,
      },
    });

    return created(repuesto);
  } catch (error) {
    return handleApiError(error, 'POST /api/repuestos/inventario');
  }
}
