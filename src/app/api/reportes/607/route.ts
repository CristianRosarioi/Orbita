import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const FiltrosSchema = z.object({
  mes:  z.coerce.number().min(1).max(12),
  anio: z.coerce.number().min(2020).max(2100),
});

// Reporte 607 — Compras a proveedores
// El módulo de compras se implementará en Fase 6. Por ahora retorna vacío con advertencia.
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const url = new URL(req.url);
    const parsed = FiltrosSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return err('VALIDATION_ERROR', 'Los parámetros mes y año son requeridos.', 422);
    }

    const { mes, anio } = parsed.data;

    const empresa = await prisma.empresa.findFirst({
      where: { id: empresaId },
      select: { modoFiscal: true },
    });

    return ok({
      periodo: { mes, anio },
      modoFiscal: empresa?.modoFiscal,
      advertencia: 'El módulo de compras (Fase 6) aún no está disponible. El reporte 607 estará completo cuando se implemente.',
      cantidadRegistros: 0,
      totalCompras: 0,
      totalITBIS: 0,
      registros: [],
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/reportes/607');
  }
}
