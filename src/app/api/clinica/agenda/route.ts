import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

const INDUSTRIAS_CLINICA = ['CLINICA', 'DENTAL', 'VETERINARIA'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_CLINICA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para clínicas.', 403);

    const empresaId = sesion.empresaActiva.id;
    const { searchParams } = req.nextUrl;
    const fecha = searchParams.get('fecha');

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha))
      return err('VALIDATION_ERROR', 'El parámetro fecha es requerido (YYYY-MM-DD).', 400);

    const inicio = new Date(`${fecha}T00:00:00`);
    const fin = new Date(`${fecha}T23:59:59`);

    const consultas = await prisma.consulta.findMany({
      where: {
        empresaId,
        fechaHora: { gte: inicio, lte: fin },
      },
      orderBy: { fechaHora: 'asc' },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            numeroExpediente: true,
            tipoSangre: true,
          },
        },
      },
    });

    return ok(consultas);
  } catch (e) {
    return handleApiError(e);
  }
}
