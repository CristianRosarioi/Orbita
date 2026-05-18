import { err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { generarTXT607, generarExcel607, type Registro607 } from '@/lib/exportar-reportes';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const FiltrosSchema = z.object({
  mes: z.coerce.number().min(1).max(12),
  anio: z.coerce.number().min(2020).max(2100),
  formato: z.enum(['txt', 'xlsx']).default('txt'),
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const parsed = FiltrosSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return err('VALIDATION_ERROR', 'Parámetros mes, año y formato son requeridos.', 422);
    }

    const { mes, anio, formato } = parsed.data;
    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 0, 23, 59, 59);

    const [empresa, gastos] = await Promise.all([
      prisma.empresa.findFirst({ where: { id: empresaId }, select: { rnc: true } }),
      prisma.gasto.findMany({
        where: { empresaId, deletedAt: null, fechaGasto: { gte: inicio, lte: fin } },
        orderBy: { fechaGasto: 'asc' },
        include: { proveedor: { select: { identificacion: true } } },
      }),
    ]);

    const rncEmpresa = empresa?.rnc ?? '';
    const nombreArchivo = `607_${anio}${String(mes).padStart(2, '0')}`;

    const registros: Registro607[] = gastos.map((g) => ({
      rncEmpresa,
      rncProveedor: g.proveedor?.identificacion ?? '',
      tipoNcf: g.ncfProveedor ? g.ncfProveedor.substring(0, 3) : '',
      ncf: g.ncfProveedor ?? '',
      ncfModificado: '',
      fechaComprobante: formatFecha(g.fechaGasto),
      fechaPago: g.fechaPago ? formatFecha(g.fechaPago) : '',
      montoServicios: 0,
      montoBienes: Number(g.monto),
      total: Number(g.total),
      itbisFacturado: Number(g.itbis),
      itbisRetenido: 0,
    }));

    if (formato === 'xlsx') {
      const buffer = generarExcel607(registros);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${nombreArchivo}.xlsx"`,
        },
      });
    }

    const txt = generarTXT607(registros);
    return new NextResponse(txt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nombreArchivo}.txt"`,
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/reportes/607/exportar');
  }
}

function formatFecha(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}
