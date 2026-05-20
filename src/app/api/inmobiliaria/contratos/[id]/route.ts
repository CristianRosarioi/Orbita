import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { z } from 'zod';

type Params = { params: Promise<{ id: string }> };

const PatchContratoSchema = z.object({
  estado: z.enum(['ACTIVO', 'VENCIDO', 'CANCELADO', 'POR_VENCER']).optional(),
  notas: z.string().optional(),
  montoMensual: z.coerce.number().positive().optional(),
  fechaFin: z.coerce.date().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const contrato = await prisma.contratoAlquiler.findFirst({
      where: { id, empresaId },
      include: {
        propiedad: true,
        cliente: { select: { id: true, nombre: true, telefono: true, email: true } },
        pagos: { orderBy: { mes: 'desc' } },
      },
    });

    if (!contrato) return err('NOT_FOUND', 'Contrato no encontrado.', 404);
    return ok(contrato);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'Formato inválido.', 400);

    const parsed = PatchContratoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const contrato = await prisma.contratoAlquiler.findFirst({
      where: { id, empresaId },
    });
    if (!contrato) return err('NOT_FOUND', 'Contrato no encontrado.', 404);

    const actualizado = await prisma.$transaction(async (tx) => {
      const c = await tx.contratoAlquiler.update({
        where: { id },
        data: parsed.data,
      });
      if (parsed.data.estado === 'CANCELADO') {
        await tx.propiedad.update({
          where: { id: contrato.propiedadId },
          data: { estado: 'DISPONIBLE' },
        });
      }
      return c;
    });

    return ok(actualizado);
  } catch (e) {
    return handleApiError(e);
  }
}
