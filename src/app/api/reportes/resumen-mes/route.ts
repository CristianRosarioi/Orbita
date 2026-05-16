import { auth } from '@clerk/nextjs/server';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const ahora = new Date();
    const mesInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const mesFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

    const [facturasMes, pagosMes, facturasVencidas, productosStockBajo] = await Promise.all([
      // Facturas emitidas este mes
      prisma.factura.findMany({
        where: {
          empresaId,
          deletedAt: null,
          estado: { in: ['EMITIDA', 'PAGADA'] },
          fechaEmision: { gte: mesInicio, lte: mesFin },
        },
        select: { total: true, saldo: true, estado: true },
      }),

      // Pagos registrados este mes
      prisma.pagoFactura.findMany({
        where: {
          empresaId,
          fechaPago: { gte: mesInicio, lte: mesFin },
        },
        select: { monto: true },
      }),

      // Facturas vencidas (EMITIDA + fechaVencimiento < hoy)
      prisma.factura.count({
        where: {
          empresaId,
          deletedAt: null,
          estado: 'EMITIDA',
          fechaVencimiento: { lt: ahora },
        },
      }),

      // Productos con stock bajo o agotado
      prisma.producto.findMany({
        where: {
          empresaId,
          deletedAt: null,
          activo: true,
          tipo: 'BIEN',
          stockMinimo: { gt: 0 },
        },
        select: { id: true, nombre: true, stockActual: true, stockMinimo: true },
      }),
    ]);

    const totalFacturadoMes = facturasMes.reduce((s, f) => s + Number(f.total), 0);
    const totalCobradoMes = pagosMes.reduce((s, p) => s + Number(p.monto), 0);
    const pendienteCobrar = facturasMes
      .filter((f) => f.estado === 'EMITIDA')
      .reduce((s, f) => s + Number(f.saldo), 0);

    const productosStockBajoFiltrados = productosStockBajo.filter(
      (p) => Number(p.stockActual) <= Number(p.stockMinimo),
    );

    return ok({
      mes: ahora.getMonth() + 1,
      anio: ahora.getFullYear(),
      totalFacturadoMes,
      totalCobradoMes,
      pendienteCobrar,
      cantidadFacturasMes: facturasMes.length,
      alertas: {
        facturasVencidas,
        productosStockBajo: productosStockBajoFiltrados.length,
        detalleStockBajo: productosStockBajoFiltrados.slice(0, 5).map((p) => ({
          nombre: p.nombre,
          stockActual: Number(p.stockActual),
          stockMinimo: Number(p.stockMinimo),
        })),
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/reportes/resumen-mes');
  }
}
