import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateOfertaSchema } from '@/lib/validations/super';

const INDUSTRIAS_SUPER = ['SUPERMERCADO', 'MINIMARKET', 'COLMADO_GRANDE'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SUPER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para supermercados.', 403);

    const empresaId = sesion.empresaActiva.id;
    const { searchParams } = req.nextUrl;
    const filtro = searchParams.get('filtro') ?? 'todas'; // activas | vencidas | todas
    const now = new Date();

    const where = {
      empresaId,
      ...(filtro === 'activas' ? { activa: true, fechaInicio: { lte: now }, fechaFin: { gte: now } } : {}),
      ...(filtro === 'vencidas' ? { fechaFin: { lt: now } } : {}),
    };

    const ofertas = await prisma.oferta.findMany({
      where,
      orderBy: { fechaFin: 'asc' },
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
        categoria: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json({ success: true, data: ofertas });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SUPER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para supermercados.', 403);

    const empresaId = sesion.empresaActiva.id;
    const body = await req.json();
    const parsed = CreateOfertaSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 400);

    const data = parsed.data;

    const producto = await prisma.producto.findFirst({
      where: { id: data.productoId, empresaId, deletedAt: null },
    });
    if (!producto) return err('NOT_FOUND', 'Producto no encontrado.', 404);

    const descuento = Math.round(((data.precioOriginal - data.precioOferta) / data.precioOriginal) * 100 * 100) / 100;

    const oferta = await prisma.oferta.create({
      data: {
        empresaId,
        productoId: data.productoId,
        categoriaId: data.categoriaId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precioOriginal: data.precioOriginal,
        precioOferta: data.precioOferta,
        descuento,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
      },
    });

    return created(oferta);
  } catch (e) {
    return handleApiError(e);
  }
}
