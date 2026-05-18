import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateOrdenCompraSchema } from '@/lib/validations/compras';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { searchParams } = req.nextUrl;
    const estado = searchParams.get('estado') ?? undefined;
    const proveedorId = searchParams.get('proveedorId') ?? undefined;

    const ordenes = await prisma.ordenCompra.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        deletedAt: null,
        ...(estado && { estado: estado as never }),
        ...(proveedorId && { proveedorId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        proveedor: { select: { id: true, nombre: true, nombreComercial: true } },
        _count: { select: { items: true } },
      },
    });

    return ok(ordenes);
  } catch (error) {
    return handleApiError(error, 'GET /api/compras/ordenes');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const empresaId = sesion.empresaActivaId;
    const body = await req.json();
    const parsed = CreateOrdenCompraSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const proveedor = await prisma.proveedor.findFirst({
      where: { id: parsed.data.proveedorId, empresaId, deletedAt: null },
    });
    if (!proveedor) return err('NOT_FOUND', 'Proveedor no encontrado.', 404);

    const orden = await prisma.$transaction(async (tx) => {
      const ultimo = await tx.ordenCompra.findFirst({
        where: { empresaId },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const numero = (ultimo?.numero ?? 0) + 1;

      // Calcular totales
      let subtotal = 0;
      let itbisTotal = 0;

      const itemsData = parsed.data.items.map((item) => {
        const itemSubtotal = item.cantidad * item.costoUnitario;
        const itemItbis = Math.round(itemSubtotal * (item.itbisPorcentaje / 100) * 100) / 100;
        const itemTotal = itemSubtotal + itemItbis;
        subtotal += itemSubtotal;
        itbisTotal += itemItbis;
        return {
          productoId: item.productoId,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          costoUnitario: item.costoUnitario,
          itbisPorcentaje: item.itbisPorcentaje,
          itbisMonto: itemItbis,
          subtotal: itemSubtotal,
          total: itemTotal,
        };
      });

      const total = Math.round((subtotal + itbisTotal) * 100) / 100;

      return tx.ordenCompra.create({
        data: {
          empresaId,
          proveedorId: parsed.data.proveedorId,
          numero,
          subtotal,
          itbis: itbisTotal,
          total,
          notas: parsed.data.notas,
          fechaEsperada: parsed.data.fechaEsperada
            ? new Date(parsed.data.fechaEsperada)
            : undefined,
          creadoPor: userId,
          items: { create: itemsData },
        },
        include: {
          proveedor: { select: { id: true, nombre: true } },
          items: true,
        },
      });
    });

    return created(orden);
  } catch (error) {
    return handleApiError(error, 'POST /api/compras/ordenes');
  }
}
