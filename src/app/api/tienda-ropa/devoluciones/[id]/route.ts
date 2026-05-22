import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { actualizarDevolucionSchema } from '@/lib/validations/tienda-ropa';

const INDUSTRIAS_TIENDA_ROPA = ['TIENDA_ROPA'];

async function getTiendaRopaEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_TIENDA_ROPA.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaRopaEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda de Ropa.', 403);

    const { id } = await params;

    const devolucion = await prisma.devolucion.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
      include: {
        factura: { select: { id: true, numero: true, total: true } },
        cliente: { select: { id: true, nombre: true, telefono: true } },
      },
    });
    if (!devolucion) return err('NOT_FOUND', 'Devolución no encontrada.', 404);

    return ok(devolucion);
  } catch (error) {
    return handleApiError(error, 'GET /api/tienda-ropa/devoluciones/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getTiendaRopaEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Tienda de Ropa.', 403);

    const { id } = await params;

    const devolucion = await prisma.devolucion.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
    });
    if (!devolucion) return err('NOT_FOUND', 'Devolución no encontrada.', 404);
    if (devolucion.estado === 'COMPLETADA')
      return err('CONFLICT', 'No se puede modificar una devolución ya completada.', 409);

    const body = await req.json();
    const parsed = actualizarDevolucionSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizada = await prisma.devolucion.update({
      where: { id },
      data: parsed.data,
      include: {
        factura: { select: { id: true, numero: true } },
        cliente: { select: { id: true, nombre: true } },
      },
    });

    return ok(actualizada);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/tienda-ropa/devoluciones/[id]');
  }
}
