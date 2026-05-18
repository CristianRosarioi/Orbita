import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateEmpleadoSchema } from '@/lib/validations/nomina';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const estado = req.nextUrl.searchParams.get('estado');

    const empleados = await prisma.empleado.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        deletedAt: null,
        ...(estado ? { estado: estado as never } : {}),
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cedula: true,
        cargo: true,
        departamento: true,
        salarioBase: true,
        tipoContrato: true,
        frecuenciaPago: true,
        estado: true,
        fechaIngreso: true,
      },
    });

    return ok(empleados);
  } catch (error) {
    return handleApiError(error, 'GET /api/nomina/empleados');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const body = await req.json();
    const parsed = CreateEmpleadoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const { cedula, email, ...rest } = parsed.data;

    const existe = await prisma.empleado.findFirst({
      where: { empresaId: sesion.empresaActivaId, cedula, deletedAt: null },
    });
    if (existe) return err('VALIDATION_ERROR', 'Ya existe un empleado con esa cédula.', 422);

    const empleado = await prisma.empleado.create({
      data: {
        ...rest,
        cedula,
        email: email || null,
        salarioBase: rest.salarioBase,
        fechaIngreso: new Date(rest.fechaIngreso),
        empresaId: sesion.empresaActivaId,
        creadoPor: sesion.usuarioId,
      },
    });

    return created(empleado);
  } catch (error) {
    return handleApiError(error, 'POST /api/nomina/empleados');
  }
}
