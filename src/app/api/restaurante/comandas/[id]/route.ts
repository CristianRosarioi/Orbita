import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateComandaSchema } from '@/lib/validations/restaurante';

const INDUSTRIAS_RESTAURANTE = ['RESTAURANTE'];

function calcularTotales(
  items: { cantidad: number | { toNumber(): number }; precio: number | { toNumber(): number } }[],
  propina: number,
) {
  const subtotal = items.reduce((s, i) => s + Number(i.cantidad) * Number(i.precio), 0);
  const itbis = Math.round(subtotal * 0.18 * 100) / 100;
  const total = Math.round((subtotal + itbis + propina) * 100) / 100;
  return { subtotal, itbis, total };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_RESTAURANTE.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const { id } = await params;
    const comanda = await prisma.comanda.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
      include: {
        mesa: { select: { numero: true, nombre: true, capacidad: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!comanda) return err('NOT_FOUND', 'Comanda no encontrada.', 404);
    return ok(comanda);
  } catch (error) {
    return handleApiError(error, 'GET /api/restaurante/comandas/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return err('VALIDATION_ERROR', 'No se puede modificar una comanda cancelada.', 422);

    const body = await req.json();
    const parsed = UpdateComandaSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const { propina, ...resto } = parsed.data;
    const propinaFinal = propina !== undefined ? propina : Number(comanda.propina);
    const { subtotal, itbis, total } = calcularTotales(comanda.items, propinaFinal);

    const actualizada = await prisma.$transaction(async (tx) => {
      const updated = await tx.comanda.update({
        where: { id },
        data: { ...resto, propina: propinaFinal, subtotal, itbis, total },
        include: { mesa: true, items: true },
      });

      // Si se cancela la comanda, liberar la mesa
      if (parsed.data.estado === 'CANCELADA' && comanda.mesaId) {
        await tx.mesa.update({
          where: { id: comanda.mesaId },
          data: { estado: 'DISPONIBLE' },
        });
      }

      return updated;
    });

    return ok(actualizada);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/restaurante/comandas/[id]');
  }
}
