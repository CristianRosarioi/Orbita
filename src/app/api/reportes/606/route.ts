import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { facturaA606 } from '@/lib/exportar-reportes';

const FiltrosSchema = z.object({
  mes:  z.coerce.number().min(1).max(12),
  anio: z.coerce.number().min(2020).max(2100),
});

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
    const desde = new Date(anio, mes - 1, 1);
    const hasta = new Date(anio, mes, 0, 23, 59, 59);

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { rnc: true, modoFiscal: true },
    });

    const facturas = await prisma.factura.findMany({
      where: {
        empresaId,
        estado: { in: ['EMITIDA', 'PAGADA'] },
        fechaEmision: { gte: desde, lte: hasta },
        deletedAt: null,
      },
      include: {
        items: { include: { producto: { select: { tipo: true } } } },
      },
      orderBy: { fechaEmision: 'asc' },
    });

    const rncEmpresa = empresa?.rnc ?? '';
    const registros = facturas.map((f) => facturaA606(f, rncEmpresa));

    return ok({
      periodo: { mes, anio },
      modoFiscal: empresa?.modoFiscal,
      advertencia: empresa?.modoFiscal === 'SIMPLE'
        ? 'Empresa en Modo Simple. Los NCF son referenciales y no tienen validez fiscal ante la DGII.'
        : null,
      cantidadRegistros: registros.length,
      totalFacturado: registros.reduce((s, r) => s + r.total, 0),
      totalITBIS: registros.reduce((s, r) => s + r.itbisFacturado, 0),
      registros,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/reportes/606');
  }
}
