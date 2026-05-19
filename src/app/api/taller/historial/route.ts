import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

const INDUSTRIAS_TALLER = ['TALLER_MECANICO', 'CARWASH', 'REPUESTOS'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para talleres.', 403);

    const placa = req.nextUrl.searchParams.get('placa');
    if (!placa || placa.trim().length < 2)
      return err('VALIDATION_ERROR', 'Proporciona al menos 2 caracteres de la placa.', 422);

    const ordenes = await prisma.ordenTrabajo.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        deletedAt: null,
        vehiculoPlaca: { contains: placa.trim().toUpperCase(), mode: 'insensitive' },
      },
      orderBy: { fechaRecepcion: 'desc' },
      include: {
        items: {
          select: { tipo: true, descripcion: true, cantidad: true, total: true },
        },
      },
    });

    return ok(ordenes);
  } catch (error) {
    return handleApiError(error, 'GET /api/taller/historial');
  }
}
