import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { UpdateProductoSchema } from '@/lib/validations/productos';
import type { Prisma } from '@/generated/prisma/client';

const INCLUDE = { categoria: true, unidadMedida: true, precios: true } as const;

async function getProducto(id: string, empresaId: string) {
  return prisma.producto.findFirst({ where: { id, empresaId, deletedAt: null }, include: INCLUDE });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;
    const producto = await getProducto(id, empresaId);
    if (!producto) return err('NOT_FOUND', 'Producto no encontrado.', 404);
    return ok(producto);
  } catch (error) {
    return handleApiError(error, 'GET /api/productos/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const existente = await prisma.producto.findFirst({ where: { id, empresaId, deletedAt: null } });
    if (!existente) return err('NOT_FOUND', 'Producto no encontrado.', 404);

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = UpdateProductoSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const { precioCredito, precioMayorista, precioEspecial, ...productoData } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const { tipo: tipoProd, imagenUrl, ...restProd } = productoData;
      const updateData: Prisma.ProductoUncheckedUpdateInput = {
        ...restProd,
        ...(tipoProd && { tipo: tipoProd as 'BIEN' | 'SERVICIO' }),
        imagenUrl: imagenUrl === '' ? null : imagenUrl,
      };
      await tx.producto.update({ where: { id }, data: updateData });

      const cambiosPrecios = [
        precioCredito !== undefined ? { nivel: 'CREDITO' as const, precio: precioCredito } : null,
        precioMayorista !== undefined ? { nivel: 'MAYORISTA' as const, precio: precioMayorista } : null,
        precioEspecial !== undefined ? { nivel: 'ESPECIAL' as const, precio: precioEspecial } : null,
      ].filter((p): p is { nivel: 'CREDITO' | 'MAYORISTA' | 'ESPECIAL'; precio: number } => p !== null);

      for (const p of cambiosPrecios) {
        await tx.precioProducto.upsert({
          where: { productoId_nivel: { productoId: id, nivel: p.nivel } },
          create: { productoId: id, nivel: p.nivel, precio: p.precio },
          update: { precio: p.precio },
        });
      }

      return tx.producto.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/productos/[id]');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const existente = await prisma.producto.findFirst({ where: { id, empresaId, deletedAt: null } });
    if (!existente) return err('NOT_FOUND', 'Producto no encontrado.', 404);

    await prisma.producto.update({ where: { id }, data: { deletedAt: new Date() } });
    return ok({ message: 'Producto eliminado.' });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/productos/[id]');
  }
}
