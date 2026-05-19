import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { AddItemOrdenTrabajoSchema } from '@/lib/validations/taller';

const INDUSTRIAS_TALLER = ['TALLER_MECANICO', 'CARWASH', 'REPUESTOS'];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para talleres.', 403);

    const { id } = await params;
    const orden = await prisma.ordenTrabajo.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
      include: { items: true },
    });
    if (!orden) return err('NOT_FOUND', 'Orden de trabajo no encontrada.', 404);
    if (orden.estado === 'ENTREGADO' || orden.estado === 'CANCELADO')
      return err('VALIDATION_ERROR', 'No se pueden agregar ítems a una orden cerrada.', 422);

    const body = await req.json();
    const parsed = AddItemOrdenTrabajoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const { cantidad, precioUnitario, itbisPorcentaje } = parsed.data;
    const subtotal = round2(cantidad * precioUnitario);
    const itbisMonto = round2(subtotal * (itbisPorcentaje / 100));
    const total = round2(subtotal + itbisMonto);

    const resultado = await prisma.$transaction(async (tx) => {
      const item = await tx.itemOrdenTrabajo.create({
        data: {
          ordenTrabajoId: id,
          tipo: parsed.data.tipo,
          descripcion: parsed.data.descripcion,
          productoId: parsed.data.productoId,
          cantidad,
          precioUnitario,
          itbisPorcentaje,
          itbisMonto,
          subtotal,
          total,
        },
      });

      // Recalcular totales de la orden
      const todosItems = [...orden.items, item];
      const nuevoSubtotal = round2(todosItems.reduce((s, i) => s + Number(i.subtotal), 0));
      const nuevoItbis = round2(todosItems.reduce((s, i) => s + Number(i.itbisMonto), 0));
      const nuevoTotal = round2(todosItems.reduce((s, i) => s + Number(i.total), 0));

      await tx.ordenTrabajo.update({
        where: { id },
        data: { subtotal: nuevoSubtotal, itbis: nuevoItbis, total: nuevoTotal },
      });

      return item;
    });

    return created(resultado);
  } catch (error) {
    return handleApiError(error, 'POST /api/taller/ordenes/[id]/items');
  }
}
