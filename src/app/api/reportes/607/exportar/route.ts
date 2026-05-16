import { err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { generarTXT607, generarExcel607, type Registro607 } from '@/lib/exportar-reportes';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const FiltrosSchema = z.object({
  mes: z.coerce.number().min(1).max(12),
  anio: z.coerce.number().min(2020).max(2100),
  formato: z.enum(['txt', 'xlsx']).default('txt'),
});

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    await requireEmpresa();

    const url = new URL(req.url);
    const parsed = FiltrosSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return err('VALIDATION_ERROR', 'Parámetros mes, año y formato son requeridos.', 422);
    }

    const { mes, anio, formato } = parsed.data;
    const registros: Registro607[] = []; // Vacío hasta Fase 6
    const nombreArchivo = `607_${anio}${String(mes).padStart(2, '0')}`;

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
