import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const FiltrosSchema = z.object({
  mes: z.coerce.number().min(1).max(12),
  anio: z.coerce.number().min(2020).max(2100),
});

// Reporte 607 — Compras y gastos del período con NCF del proveedor
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
    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 0, 23, 59, 59);

    const [empresa, gastos] = await Promise.all([
      prisma.empresa.findFirst({
        where: { id: empresaId },
        select: { rnc: true, nombre: true, modoFiscal: true },
      }),
      prisma.gasto.findMany({
        where: {
          empresaId,
          deletedAt: null,
          fechaGasto: { gte: inicio, lte: fin },
        },
        orderBy: { fechaGasto: 'asc' },
        include: {
          proveedor: {
            select: {
              nombre: true,
              nombreComercial: true,
              identificacion: true,
              tipoIdentificacion: true,
            },
          },
        },
      }),
    ]);

    const totalCompras = gastos.reduce((s, g) => s + Number(g.monto), 0);
    const totalITBIS = gastos.reduce((s, g) => s + Number(g.itbis), 0);
    const totalGeneral = gastos.reduce((s, g) => s + Number(g.total), 0);

    const registros = gastos.map((g) => ({
      id: g.id,
      fechaGasto: g.fechaGasto,
      descripcion: g.descripcion,
      categoria: g.categoria,
      proveedorNombre: g.proveedor?.nombre ?? g.descripcion,
      proveedorRnc: g.proveedor?.identificacion ?? '',
      ncfProveedor: g.ncfProveedor ?? '',
      comprobante: g.comprobante ?? '',
      monto: Number(g.monto),
      itbis: Number(g.itbis),
      total: Number(g.total),
      estado: g.estado,
    }));

    return ok({
      periodo: { mes, anio },
      empresa: { rnc: empresa?.rnc ?? '', nombre: empresa?.nombre ?? '', modoFiscal: empresa?.modoFiscal },
      cantidadRegistros: registros.length,
      totalCompras: Math.round(totalCompras * 100) / 100,
      totalITBIS: Math.round(totalITBIS * 100) / 100,
      totalGeneral: Math.round(totalGeneral * 100) / 100,
      registros,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/reportes/607');
  }
}
