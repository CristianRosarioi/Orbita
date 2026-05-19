import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

const INDUSTRIAS_FARMACIA = ['FARMACIA', 'BOTICA', 'DROGUERIA'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_FARMACIA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para farmacias.', 403);

    const dias = parseInt(req.nextUrl.searchParams.get('dias') ?? '30');
    const incluirVencidos = req.nextUrl.searchParams.get('vencidos') === 'true';

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(hoy.getDate() + dias);

    const lotes = await prisma.lote.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        activo: true,
        cantidadActual: { gt: 0 },
        ...(incluirVencidos
          ? { fechaVencimiento: { lt: hoy } }
          : { fechaVencimiento: { gte: hoy, lte: limite } }),
      },
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    const resultado = lotes.map((lote) => {
      const diffMs = lote.fechaVencimiento.getTime() - hoy.getTime();
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { ...lote, diasRestantes };
    });

    return ok(resultado);
  } catch (error) {
    return handleApiError(error, 'GET /api/farmacia/vencimientos');
  }
}
