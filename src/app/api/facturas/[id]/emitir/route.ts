import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { emitirFactura } from '@/lib/facturacion';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const { id } = await params;

    const factura = await prisma.$transaction(async (tx) => {
      return emitirFactura(id, empresaId, userId, tx);
    });

    return ok(factura);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'FACTURA_NO_ENCONTRADA') {
        return err('NOT_FOUND', 'Factura no encontrada.', 404);
      }
      if (error.message === 'SOLO_BORRADORES_SE_PUEDEN_EMITIR') {
        return err('INVALID_STATE', 'Solo se pueden emitir facturas en estado Borrador.', 422);
      }
    }
    return handleApiError(error, 'POST /api/facturas/[id]/emitir');
  }
}
