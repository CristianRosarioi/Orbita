import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateConsultaSchema } from '@/lib/validations/clinica';

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
    const estado = searchParams.get('estado');
    const medico = searchParams.get('medico');
    const fecha = searchParams.get('fecha');
    const pacienteId = searchParams.get('pacienteId');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));

    const where = {
      empresaId,
      ...(estado ? { estado: estado as never } : {}),
      ...(medico ? { medicoNombre: { contains: medico, mode: 'insensitive' as const } } : {}),
      ...(pacienteId ? { pacienteId } : {}),
      ...(fecha
        ? {
            fechaHora: {
              gte: new Date(`${fecha}T00:00:00`),
              lte: new Date(`${fecha}T23:59:59`),
            },
          }
        : {}),
    };

    const [total, consultas] = await Promise.all([
      prisma.consulta.count({ where }),
      prisma.consulta.findMany({
        where,
        orderBy: { fechaHora: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          paciente: {
            select: { id: true, nombre: true, apellido: true, numeroExpediente: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: consultas,
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
    const parsed = CreateConsultaSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos.', 400);

    const data = parsed.data;

    // Verificar que el paciente pertenece a esta empresa
    const paciente = await prisma.paciente.findFirst({
      where: { id: data.pacienteId, empresaId, deletedAt: null },
    });
    if (!paciente) return err('NOT_FOUND', 'Paciente no encontrado.', 404);

    const consulta = await prisma.consulta.create({
      data: {
        empresaId,
        pacienteId: data.pacienteId,
        medicoNombre: data.medicoNombre,
        fechaHora: new Date(data.fechaHora),
        motivo: data.motivo,
        diagnostico: data.diagnostico,
        tratamiento: data.tratamiento,
        receta: data.receta,
        peso: data.peso,
        talla: data.talla,
        temperatura: data.temperatura,
        frecuenciaCard: data.frecuenciaCard,
        presionArterial: data.presionArterial,
        notas: data.notas,
        precio: data.precio,
      },
      include: {
        paciente: {
          select: { id: true, nombre: true, apellido: true, numeroExpediente: true },
        },
      },
    });

    return created(consulta);
  } catch (e) {
    return handleApiError(e);
  }
}
