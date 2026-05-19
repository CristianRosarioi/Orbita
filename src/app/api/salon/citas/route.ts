import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateCitaSchema } from '@/lib/validations/salon';

const INDUSTRIAS_SALON = ['SALON_BARBERIA'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SALON.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para salones.', 403);

    const { searchParams } = req.nextUrl;
    const estado = searchParams.get('estado');
    const fecha = searchParams.get('fecha');
    const empleadoId = searchParams.get('empleadoId');

    const citas = await prisma.cita.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        ...(estado ? { estado: estado as never } : {}),
        ...(empleadoId ? { empleadoId } : {}),
        ...(fecha
          ? {
              fecha: {
                gte: new Date(`${fecha}T00:00:00`),
                lte: new Date(`${fecha}T23:59:59`),
              },
            }
          : {}),
      },
      orderBy: { fecha: 'asc' },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
      },
    });

    return ok(citas);
  } catch (error) {
    return handleApiError(error, 'GET /api/salon/citas');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SALON.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para salones.', 403);

    const body = await req.json();
    const parsed = CreateCitaSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const cita = await prisma.cita.create({
      data: {
        empresaId: sesion.empresaActivaId,
        clienteId: parsed.data.clienteId,
        clienteNombre: parsed.data.clienteNombre,
        clienteTelefono: parsed.data.clienteTelefono,
        empleadoId: parsed.data.empleadoId,
        servicio: parsed.data.servicio,
        fecha: new Date(parsed.data.fecha),
        duracionMin: parsed.data.duracionMin,
        precio: parsed.data.precio,
        notas: parsed.data.notas,
        creadoPor: sesion.usuarioId,
      },
    });

    return created(cita);
  } catch (error) {
    return handleApiError(error, 'POST /api/salon/citas');
  }
}
