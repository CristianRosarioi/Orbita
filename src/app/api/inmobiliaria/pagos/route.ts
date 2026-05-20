import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();

    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');
    const estado = searchParams.get('estado');
    const contratoId = searchParams.get('contratoId');
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 30)));
    const skip = (page - 1) * limit;

    const where = {
      empresaId,
      ...(mes && { mes: { startsWith: mes.substring(0, 7) } }),
      ...(estado && { estado }),
      ...(contratoId && { contratoId }),
    };

    const [pagos, total] = await Promise.all([
      prisma.pagoAlquiler.findMany({
        where,
        orderBy: [{ mes: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          contrato: {
            select: {
              inquilinoNombre: true,
              montoMensual: true,
              propiedad: { select: { codigo: true, nombre: true } },
            },
          },
        },
      }),
      prisma.pagoAlquiler.count({ where }),
    ]);

    const totalCobrado = pagos
      .filter((p) => p.estado === 'PAGADO')
      .reduce((sum, p) => sum + Number(p.monto), 0);

    return NextResponse.json({
      success: true,
      data: pagos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalCobrado,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
