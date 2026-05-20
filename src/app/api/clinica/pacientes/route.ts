import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreatePacienteSchema } from '@/lib/validations/clinica';

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
    const q = searchParams.get('q');
    const estado = searchParams.get('estado');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));

    const where = {
      empresaId,
      deletedAt: null,
      ...(estado ? { estado: estado as never } : {}),
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' as const } },
              { apellido: { contains: q, mode: 'insensitive' as const } },
              { cedula: { contains: q } },
              { numeroExpediente: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, pacientes] = await Promise.all([
      prisma.paciente.count({ where }),
      prisma.paciente.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          numeroExpediente: true,
          nombre: true,
          apellido: true,
          cedula: true,
          fechaNacimiento: true,
          sexo: true,
          telefono: true,
          email: true,
          tipoSangre: true,
          estado: true,
          createdAt: true,
          _count: { select: { consultas: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: pacientes,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_CLINICA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para clínicas.', 403);

    const empresaId = sesion.empresaActiva.id;
    const body = await req.json();
    const parsed = CreatePacienteSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos.', 400);

    const data = parsed.data;

    // Verificar cédula duplicada dentro de la empresa
    if (data.cedula) {
      const existe = await prisma.paciente.findFirst({
        where: { empresaId, cedula: data.cedula, deletedAt: null },
      });
      if (existe) return err('CONFLICT', 'Ya existe un paciente con esa cédula.', 409);
    }

    // Auto-incrementar número de expediente
    const paciente = await prisma.$transaction(async (tx) => {
      const ultimo = await tx.paciente.findFirst({
        where: { empresaId },
        orderBy: { createdAt: 'desc' },
        select: { numeroExpediente: true },
      });

      const siguiente = ultimo
        ? String(parseInt(ultimo.numeroExpediente.replace(/\D/g, '') || '0', 10) + 1).padStart(6, '0')
        : '000001';

      return tx.paciente.create({
        data: {
          empresaId,
          numeroExpediente: siguiente,
          nombre: data.nombre,
          apellido: data.apellido,
          fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : undefined,
          sexo: data.sexo,
          cedula: data.cedula,
          telefono: data.telefono,
          email: data.email,
          direccion: data.direccion,
          tipoSangre: data.tipoSangre,
          alergias: data.alergias,
          antecedentes: data.antecedentes,
          clienteId: data.clienteId,
        },
      });
    });

    return created(paciente);
  } catch (e) {
    return handleApiError(e);
  }
}
