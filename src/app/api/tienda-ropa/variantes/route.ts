import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { crearVarianteSchema } from '@/lib/validations/tienda-ropa';

const INDUSTRIAS_TIENDA_ROPA = ['TIENDA_ROPA'];

async function getTiendaRopaEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_TIENDA_ROPA.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaRopaEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda de Ropa.', 403);

    const { searchParams } = new URL(req.url);
    const productoId = searchParams.get('productoId') ?? undefined;
    const soloActivas = searchParams.get('activas') === 'true';

    if (!productoId) return err('VALIDATION_ERROR', 'El parámetro productoId es requerido.', 422);

    const producto = await prisma.producto.findFirst({
      where: { id: productoId, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!producto) return err('NOT_FOUND', 'Producto no encontrado.', 404);

    const variantes = await prisma.variante.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        productoId,
        ...(soloActivas && { activa: true }),
      },
      orderBy: [{ talla: 'asc' }, { color: 'asc' }],
    });

    return ok(variantes);
  } catch (error) {
    return handleApiError(error, 'GET /api/tienda-ropa/variantes');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaRopaEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda de Ropa.', 403);

    const body = await req.json();
    const parsed = crearVarianteSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const data = parsed.data;

    const producto = await prisma.producto.findFirst({
      where: { id: data.productoId, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!producto) return err('NOT_FOUND', 'Producto no encontrado.', 404);

    const duplicada = await prisma.variante.findFirst({
      where: {
        empresaId: sesion.empresaActivaId,
        productoId: data.productoId,
        talla: data.talla ?? null,
        color: data.color ?? null,
      },
    });
    if (duplicada)
      return err('CONFLICT', 'Ya existe una variante con esa talla y color para este producto.', 409);

    const variante = await prisma.variante.create({
      data: {
        empresaId: sesion.empresaActivaId,
        productoId: data.productoId,
        talla: data.talla ?? null,
        color: data.color ?? null,
        sku: data.sku ?? null,
        stock: data.stock,
        precio: data.precio ?? null,
      },
    });

    return created(variante);
  } catch (error) {
    return handleApiError(error, 'POST /api/tienda-ropa/variantes');
  }
}
