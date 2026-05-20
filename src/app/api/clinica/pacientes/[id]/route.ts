import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdatePacienteSchema } from '@/lib/validations/clinica';

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

    const paciente = await prisma.paciente.findFirst({
      where: { id, empresaId, deletedAt: null },
      include: {
        consultas: {
          orderBy: { fechaHora: 'desc' },
          select: {
            id: true,
            medicoNombre: true,
            fechaHora: true,
            motivo: true,
            diagnostico: true,
            estado: true,
            precio: true,
            facturaId: true,
          },
        },
        cliente: {
          select: { id: true, nombre: true, identificacion: true },
        },
      },
    });

    if (!paciente) return err('NOT_FOUND', 'Paciente no encontrado.', 404);

    return ok(paciente);
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

    const paciente = await prisma.paciente.findFirst({
      where: { id, empresaId, deletedAt: null },
    });
    if (!paciente) return err('NOT_FOUND', 'Paciente no encontrado.', 404);

    const body = await req.json();
    const parsed = UpdatePacienteSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos.', 400);

    const data = parsed.data;

    if (data.cedula && data.cedula !== paciente.cedula) {
      const existe = await prisma.paciente.findFirst({
        where: { empresaId, cedula: data.cedula, deletedAt: null, id: { not: id } },
      });
      if (existe) return err('CONFLICT', 'Ya existe un paciente con esa cédula.', 409);
    }

    const actualizado = await prisma.paciente.update({
      where: { id },
      data: {
        ...data,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : undefined,
      },
    });

    return ok(actualizado);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_CLINICA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para clínicas.', 403);

    const { id } = await params;
    const empresaId = sesion.empresaActiva.id;

    const paciente = await prisma.paciente.findFirst({
      where: { id, empresaId, deletedAt: null },
    });
    if (!paciente) return err('NOT_FOUND', 'Paciente no encontrado.', 404);

    await prisma.paciente.update({
      where: { id },
      data: { deletedAt: new Date(), estado: 'ARCHIVADO' },
    });

    return ok({ mensaje: 'Expediente archivado correctamente.' });
  } catch (e) {
    return handleApiError(e);
  }
}
