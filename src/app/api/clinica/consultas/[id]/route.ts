import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateConsultaSchema } from '@/lib/validations/clinica';

const INDUSTRIAS_CLINICA = ['CLINICA', 'DENTAL', 'VETERINARIA'];

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_CLINICA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para clínicas.', 403);

    const { id } = await params;
    const empresaId = sesion.empresaActiva.id;

    const consulta = await prisma.consulta.findFirst({
      where: { id, empresaId },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            numeroExpediente: true,
            cedula: true,
            fechaNacimiento: true,
            sexo: true,
            tipoSangre: true,
            alergias: true,
          },
        },
        factura: {
          select: { id: true, numero: true, total: true, estado: true },
        },
      },
    });

    if (!consulta) return err('NOT_FOUND', 'Consulta no encontrada.', 404);

    return ok(consulta);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_CLINICA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para clínicas.', 403);

    const { id } = await params;
    const empresaId = sesion.empresaActiva.id;

    const consulta = await prisma.consulta.findFirst({ where: { id, empresaId } });
    if (!consulta) return err('NOT_FOUND', 'Consulta no encontrada.', 404);

    if (consulta.estado === 'COMPLETADA')
      return err('FORBIDDEN', 'No se puede modificar una consulta completada.', 403);

    const body = await req.json();
    const parsed = UpdateConsultaSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos.', 400);

    const data = parsed.data;

    const actualizada = await prisma.consulta.update({
      where: { id },
      data: {
        ...data,
        fechaHora: data.fechaHora ? new Date(data.fechaHora) : undefined,
      },
    });

    return ok(actualizada);
  } catch (e) {
    return handleApiError(e);
  }
}
