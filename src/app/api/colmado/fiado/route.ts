import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateCuentaFiadoSchema } from '@/lib/validations/colmado';

const INDUSTRIAS_COLMADO = ['COLMADO', 'TIENDA_ONLINE', 'FARMACIA', 'TIENDA_ROPA'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_COLMADO.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo no está disponible para tu industria.', 403);

    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') ?? undefined;

    const cuentas = await prisma.cuentaFiado.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        ...(search && {
          cliente: { nombre: { contains: search, mode: 'insensitive' } },
        }),
      },
      orderBy: { saldo: 'desc' },
      include: {
        cliente: { select: { id: true, nombre: true, nombreComercial: true, telefono: true } },
      },
    });

    return ok(cuentas);
  } catch (error) {
    return handleApiError(error, 'GET /api/colmado/fiado');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_COLMADO.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo no está disponible para tu industria.', 403);

    const body = await req.json();
    const parsed = CreateCuentaFiadoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const empresaId = sesion.empresaActivaId;

    const cliente = await prisma.cliente.findFirst({
      where: { id: parsed.data.clienteId, empresaId, deletedAt: null },
    });
    if (!cliente) return err('NOT_FOUND', 'Cliente no encontrado.', 404);

    const cuenta = await prisma.cuentaFiado.create({
      data: {
        empresaId,
        clienteId: parsed.data.clienteId,
        limite: parsed.data.limite,
        notas: parsed.data.notas,
      },
      include: { cliente: { select: { nombre: true } } },
    });

    return created(cuenta);
  } catch (error) {
    return handleApiError(error, 'POST /api/colmado/fiado');
  }
}
