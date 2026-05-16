import { auth } from '@clerk/nextjs/server';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { crearAsientoFactura } from '@/lib/asientos';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    await requireRole(['OWNER', 'ADMIN']);
    const empresaId = await requireEmpresa();

    // Facturas EMITIDAS o PAGADAS sin asiento contable
    const asientosExistentes = await prisma.asientoContable.findMany({
      where: { empresaId, facturaId: { not: null } },
      select: { facturaId: true },
    });
    const idsConAsiento = new Set(asientosExistentes.map((a) => a.facturaId).filter(Boolean));

    const facturasSinAsiento = await prisma.factura.findMany({
      where: {
        empresaId,
        estado: { in: ['EMITIDA', 'PAGADA'] },
        deletedAt: null,
        id: { notIn: idsConAsiento.size > 0 ? ([...idsConAsiento] as string[]) : ['__none__'] },
      },
      select: { id: true },
    });

    if (facturasSinAsiento.length === 0) {
      return ok({
        asientosCreados: 0,
        mensaje: 'Todas las facturas ya tienen asientos contables.',
      });
    }

    let asientosCreados = 0;
    for (const factura of facturasSinAsiento) {
      try {
        await prisma.$transaction(async (tx) => {
          await crearAsientoFactura(factura.id, empresaId, userId, tx);
        });
        asientosCreados++;
      } catch {
        // Si no existen las cuentas, continúa con la siguiente
      }
    }

    return ok({
      asientosCreados,
      facturasProcesadas: facturasSinAsiento.length,
      mensaje: `Se crearon ${asientosCreados} asientos contables históricos.`,
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/contabilidad/retroalimentar');
  }
}
