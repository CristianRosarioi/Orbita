import { err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { facturaA608, generarTXT608, generarExcel608 } from '@/lib/exportar-reportes';
import { NextResponse } from 'next/server';

const FiltrosSchema = z.object({
  mes:     z.coerce.number().min(1).max(12),
  anio:    z.coerce.number().min(2020).max(2100),
  formato: z.enum(['txt', 'xlsx']).default('txt'),
});

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const url = new URL(req.url);
    const parsed = FiltrosSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return err('VALIDATION_ERROR', 'Parámetros mes, año y formato son requeridos.', 422);
    }

    const { mes, anio, formato } = parsed.data;
    const desde = new Date(anio, mes - 1, 1);
    const hasta = new Date(anio, mes, 0, 23, 59, 59);

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { rnc: true },
    });

    const facturas = await prisma.factura.findMany({
      where: {
        empresaId,
        estado: 'ANULADA',
        updatedAt: { gte: desde, lte: hasta },
        deletedAt: null,
      },
      include: {
        items: { include: { producto: { select: { tipo: true } } } },
      },
      orderBy: { updatedAt: 'asc' },
    });

    const rncEmpresa = empresa?.rnc ?? '';
    const registros = facturas.map((f) => facturaA608(f, rncEmpresa));
    const nombreArchivo = `608_${anio}${String(mes).padStart(2, '0')}`;

    if (formato === 'xlsx') {
      const buffer = generarExcel608(registros);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${nombreArchivo}.xlsx"`,
        },
      });
    }

    const txt = generarTXT608(registros);
    return new NextResponse(txt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nombreArchivo}.txt"`,
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/reportes/608/exportar');
  }
}
