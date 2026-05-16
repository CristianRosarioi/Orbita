import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const FiltrosSchema = z.object({
  mes:  z.coerce.number().min(1).max(12).optional(),
  anio: z.coerce.number().min(2020).max(2100).optional(),
});

// Estado de resultados: ingresos - gastos = utilidad neta
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const url = new URL(req.url);
    const parsed = FiltrosSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Parámetros inválidos.', 422);
    }

    const { mes, anio } = parsed.data;
    const anioFiltro = anio ?? new Date().getFullYear();

    let fechaDesde: Date;
    let fechaHasta: Date;
    if (mes) {
      fechaDesde = new Date(anioFiltro, mes - 1, 1);
      fechaHasta = new Date(anioFiltro, mes, 0, 23, 59, 59);
    } else {
      fechaDesde = new Date(anioFiltro, 0, 1);
      fechaHasta = new Date(anioFiltro, 11, 31, 23, 59, 59);
    }

    const cuentas = await prisma.cuentaContable.findMany({
      where: { empresaId, deletedAt: null, tipo: { in: ['INGRESO', 'GASTO'] } },
      include: {
        lineas: {
          where: {
            asiento: { fecha: { gte: fechaDesde, lte: fechaHasta } },
          },
          select: { tipo: true, monto: true },
        },
      },
      orderBy: { codigo: 'asc' },
    });

    const ingresos = cuentas
      .filter((c) => c.tipo === 'INGRESO')
      .map((c) => {
        const creditos = c.lineas.filter((l) => l.tipo === 'CREDITO').reduce((s, l) => s + Number(l.monto), 0);
        const debitos  = c.lineas.filter((l) => l.tipo === 'DEBITO').reduce((s, l) => s + Number(l.monto), 0);
        return { codigo: c.codigo, nombre: c.nombre, monto: creditos - debitos };
      });

    const gastos = cuentas
      .filter((c) => c.tipo === 'GASTO')
      .map((c) => {
        const debitos  = c.lineas.filter((l) => l.tipo === 'DEBITO').reduce((s, l) => s + Number(l.monto), 0);
        const creditos = c.lineas.filter((l) => l.tipo === 'CREDITO').reduce((s, l) => s + Number(l.monto), 0);
        return { codigo: c.codigo, nombre: c.nombre, monto: debitos - creditos };
      });

    const totalIngresos = ingresos.reduce((s, c) => s + c.monto, 0);
    const totalGastos   = gastos.reduce((s, c) => s + c.monto, 0);
    const utilidadNeta  = totalIngresos - totalGastos;

    return ok({
      periodo: { mes, anio: anioFiltro },
      ingresos,
      gastos,
      totalIngresos,
      totalGastos,
      utilidadNeta,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/contabilidad/resultados');
  }
}
