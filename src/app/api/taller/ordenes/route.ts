import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateOrdenTrabajoSchema } from '@/lib/validations/taller';

const INDUSTRIAS_TALLER = ['TALLER_MECANICO', 'CARWASH', 'REPUESTOS'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para talleres.', 403);

    const { searchParams } = req.nextUrl;
    const estado = searchParams.get('estado');
    const placa = searchParams.get('placa');
    const tecnico = searchParams.get('tecnico');

    const ordenes = await prisma.ordenTrabajo.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        deletedAt: null,
        ...(estado ? { estado: estado as never } : {}),
        ...(placa ? { vehiculoPlaca: { contains: placa, mode: 'insensitive' } } : {}),
        ...(tecnico ? { tecnico: { contains: tecnico, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        numero: true,
        clienteNombre: true,
        clienteTelefono: true,
        vehiculoMarca: true,
        vehiculoModelo: true,
        vehiculoPlaca: true,
        estado: true,
        tecnico: true,
        total: true,
        fechaPromesa: true,
        fechaRecepcion: true,
        _count: { select: { items: true } },
      },
    });

    return ok(ordenes);
  } catch (error) {
    return handleApiError(error, 'GET /api/taller/ordenes');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para talleres.', 403);

    const body = await req.json();
    const parsed = CreateOrdenTrabajoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const orden = await prisma.$transaction(async (tx) => {
      const ultima = await tx.ordenTrabajo.findFirst({
        where: { empresaId: sesion.empresaActivaId },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const numero = (ultima?.numero ?? 0) + 1;

      return tx.ordenTrabajo.create({
        data: {
          empresaId: sesion.empresaActivaId,
          numero,
          clienteId: parsed.data.clienteId,
          clienteNombre: parsed.data.clienteNombre,
          clienteTelefono: parsed.data.clienteTelefono,
          vehiculoMarca: parsed.data.vehiculoMarca,
          vehiculoModelo: parsed.data.vehiculoModelo,
          vehiculoAnio: parsed.data.vehiculoAnio,
          vehiculoPlaca: parsed.data.vehiculoPlaca.toUpperCase(),
          vehiculoColor: parsed.data.vehiculoColor,
          kilometraje: parsed.data.kilometraje,
          descripcionFalla: parsed.data.descripcionFalla,
          tecnico: parsed.data.tecnico,
          fechaPromesa: parsed.data.fechaPromesa ? new Date(parsed.data.fechaPromesa) : null,
          notas: parsed.data.notas,
          creadoPor: sesion.usuarioId,
        },
      });
    });

    return created(orden);
  } catch (error) {
    return handleApiError(error, 'POST /api/taller/ordenes');
  }
}
