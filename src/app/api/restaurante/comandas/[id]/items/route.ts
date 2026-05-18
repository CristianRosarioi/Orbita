import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { AddItemComandaSchema } from '@/lib/validations/restaurante';

const INDUSTRIAS_RESTAURANTE = ['RESTAURANTE'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_RESTAURANTE.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const { id } = await params;
    const comanda = await prisma.comanda.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
      include: { items: true },
    });
    if (!comanda) return err('NOT_FOUND', 'Comanda no encontrada.', 404);
    if (comanda.estado === 'CANCELADA')
      return err('VALIDATION_ERROR', 'No se puede agregar ítems a una comanda cancelada.', 422);
    if (comanda.estado === 'SERVIDA')
      return err('VALIDATION_ERROR', 'No se puede modificar una comanda ya servida.', 422);

    const body = await req.json();
    const parsed = AddItemComandaSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const item = await prisma.$transaction(async (tx) => {
      const nuevoItem = await tx.itemComanda.create({
        data: {
          comandaId: id,
          productoId: parsed.data.productoId,
          nombre: parsed.data.nombre,
          cantidad: parsed.data.cantidad,
          precio: parsed.data.precio,
          notas: parsed.data.notas,
        },
      });

      // Recalcular totales de la comanda
      const todosItems = [...comanda.items, nuevoItem];
      const subtotal = todosItems.reduce((s, i) => s + Number(i.cantidad) * Number(i.precio), 0);
      const itbis = Math.round(subtotal * 0.18 * 100) / 100;
      const total = Math.round((subtotal + itbis + Number(comanda.propina)) * 100) / 100;

      await tx.comanda.update({
        where: { id },
        data: { subtotal, itbis, total },
      });

      return nuevoItem;
    });

    return created(item);
  } catch (error) {
    return handleApiError(error, 'POST /api/restaurante/comandas/[id]/items');
  }
}
