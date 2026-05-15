import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { anularFactura } from '@/lib/facturacion';
import { z } from 'zod';

const AnularSchema = z.object({
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres.').max(500),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const { id } = await params;

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = AnularSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const { motivo } = parsed.data;

    const factura = await prisma.$transaction(async (tx) => {
      return anularFactura(id, empresaId, motivo, userId, tx);
    });

    return ok(factura);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'FACTURA_NO_ENCONTRADA') {
        return err('NOT_FOUND', 'Factura no encontrada.', 404);
      }
      if (error.message === 'FACTURA_YA_ANULADA') {
        return err('INVALID_STATE', 'Esta factura ya fue anulada.', 422);
      }
    }
    return handleApiError(error, 'POST /api/facturas/[id]/anular');
  }
}
