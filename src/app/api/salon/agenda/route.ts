import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

const INDUSTRIAS_SALON = ['SALON_BARBERIA'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SALON.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para salones.', 403);

    const fechaParam = req.nextUrl.searchParams.get('fecha');
    const fecha = fechaParam ? new Date(fechaParam) : new Date();

    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);

    const citas = await prisma.cita.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        fecha: { gte: inicio, lte: fin },
        estado: { not: 'CANCELADA' },
      },
      orderBy: { fecha: 'asc' },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
      },
    });

    return ok(citas);
  } catch (error) {
    return handleApiError(error, 'GET /api/salon/agenda');
  }
}
