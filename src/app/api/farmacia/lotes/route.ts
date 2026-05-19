import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateLoteSchema } from '@/lib/validations/farmacia';

const INDUSTRIAS_FARMACIA = ['FARMACIA', 'BOTICA', 'DROGUERIA'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_FARMACIA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para farmacias.', 403);

    const { searchParams } = req.nextUrl;
    const productoId = searchParams.get('productoId');
    const vencimiento = searchParams.get('vencimiento'); // 'vigente' | 'por_vencer' | 'vencido'

    const hoy = new Date();
    const en30dias = new Date(hoy);
    en30dias.setDate(hoy.getDate() + 30);

    const lotes = await prisma.lote.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        ...(productoId ? { productoId } : {}),
        ...(vencimiento === 'vencido'
          ? { fechaVencimiento: { lt: hoy } }
          : vencimiento === 'por_vencer'
            ? { fechaVencimiento: { gte: hoy, lte: en30dias } }
            : vencimiento === 'vigente'
              ? { fechaVencimiento: { gt: en30dias } }
              : {}),
      },
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    return ok(lotes);
  } catch (error) {
    return handleApiError(error, 'GET /api/farmacia/lotes');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_FARMACIA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para farmacias.', 403);

    const body = await req.json();
    const parsed = CreateLoteSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const producto = await prisma.producto.findFirst({
      where: { id: parsed.data.productoId, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!producto) return err('NOT_FOUND', 'Producto no encontrado.', 404);

    const lote = await prisma.lote.create({
      data: {
        empresaId: sesion.empresaActivaId,
        productoId: parsed.data.productoId,
        numeroLote: parsed.data.numeroLote,
        fechaVencimiento: new Date(parsed.data.fechaVencimiento),
        cantidadInicial: parsed.data.cantidadInicial,
        cantidadActual: parsed.data.cantidadInicial,
        precioCompra: parsed.data.precioCompra,
        proveedor: parsed.data.proveedor,
        notas: parsed.data.notas,
      },
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
      },
    });

    return created(lote);
  } catch (error) {
    return handleApiError(error, 'POST /api/farmacia/lotes');
  }
}
