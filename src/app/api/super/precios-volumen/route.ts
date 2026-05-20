import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreatePrecioVolumenSchema } from '@/lib/validations/super';

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
    const productoId = searchParams.get('productoId');

    const precios = await prisma.precioVolumen.findMany({
      where: {
        empresaId,
        activo: true,
        ...(productoId ? { productoId } : {}),
      },
      orderBy: [{ productoId: 'asc' }, { cantidadMin: 'asc' }],
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
      },
    });

    return NextResponse.json({ success: true, data: precios });
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
    const parsed = CreatePrecioVolumenSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos.', 400);

    const data = parsed.data;

    const producto = await prisma.producto.findFirst({
      where: { id: data.productoId, empresaId, deletedAt: null },
    });
    if (!producto) return err('NOT_FOUND', 'Producto no encontrado.', 404);

    const precio = await prisma.precioVolumen.create({
      data: {
        empresaId,
        productoId: data.productoId,
        cantidadMin: data.cantidadMin,
        precio: data.precio,
        etiqueta: data.etiqueta,
      },
    });

    return created(precio);
  } catch (e) {
    return handleApiError(e);
  }
}
