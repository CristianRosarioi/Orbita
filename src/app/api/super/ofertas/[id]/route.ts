import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateOfertaSchema } from '@/lib/validations/super';

const INDUSTRIAS_SUPER = ['SUPERMERCADO', 'MINIMARKET', 'COLMADO_GRANDE'];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SUPER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para supermercados.', 403);

    const { id } = await params;
    const empresaId = sesion.empresaActiva.id;

    const oferta = await prisma.oferta.findFirst({ where: { id, empresaId } });
    if (!oferta) return err('NOT_FOUND', 'Oferta no encontrada.', 404);

    const body = await req.json();
    const parsed = UpdateOfertaSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos.', 400);

    const data = parsed.data;

    // Recalcular descuento si cambia el precio de oferta
    let descuento = Number(oferta.descuento);
    if (data.precioOferta !== undefined) {
      const precioOrig = Number(oferta.precioOriginal);
      descuento = Math.round(((precioOrig - data.precioOferta) / precioOrig) * 100 * 100) / 100;
    }

    const actualizada = await prisma.oferta.update({
      where: { id },
      data: {
        ...data,
        descuento,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
      },
    });

    return ok(actualizada);
  } catch (e) {
    return handleApiError(e);
  }
}
