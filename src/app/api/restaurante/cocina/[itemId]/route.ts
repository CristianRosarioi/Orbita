import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { z } from 'zod';

const INDUSTRIAS_RESTAURANTE = ['RESTAURANTE'];

const EstadoItemSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'CANCELADO']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_RESTAURANTE.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const { itemId } = await params;

    const item = await prisma.itemComanda.findFirst({
      where: { id: itemId },
      include: { comanda: { select: { empresaId: true } } },
    });

    if (!item || item.comanda.empresaId !== sesion.empresaActivaId)
      return err('NOT_FOUND', 'Ítem no encontrado.', 404);

    const body = await req.json();
    const parsed = EstadoItemSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Estado inválido.', 422);

    const actualizado = await prisma.itemComanda.update({
      where: { id: itemId },
      data: { estado: parsed.data.estado },
    });

    return ok(actualizado);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/restaurante/cocina/[itemId]');
  }
}
