import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { actualizarEstadoCotizacionSchema } from '@/lib/validations/repuestos';

const INDUSTRIAS_REPUESTOS = ['REPUESTOS'];

async function getRepuestosEmpresa() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) return null;
  if (!INDUSTRIAS_REPUESTOS.includes(sesion.empresaActiva.industria)) return null;
  return sesion;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getRepuestosEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Repuestos.', 403);

    const { id } = await params;

    const cotizacion = await prisma.cotizacion.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        items: {
          include: { repuesto: { select: { id: true, codigo: true, nombre: true } } },
        },
      },
    });
    if (!cotizacion) return err('NOT_FOUND', 'Cotización no encontrada.', 404);

    return ok(cotizacion);
  } catch (error) {
    return handleApiError(error, 'GET /api/repuestos/cotizaciones/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getRepuestosEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Este módulo es exclusivo para Repuestos.', 403);

    const { id } = await params;

    const cotizacion = await prisma.cotizacion.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
    });
    if (!cotizacion) return err('NOT_FOUND', 'Cotización no encontrada.', 404);
    if (cotizacion.estado === 'FACTURADA')
      return err('CONFLICT', 'No se puede modificar una cotización ya facturada.', 409);

    const body = await req.json();
    const parsed = actualizarEstadoCotizacionSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const actualizada = await prisma.cotizacion.update({
      where: { id },
      data: { estado: parsed.data.estado },
    });

    return ok(actualizada);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/repuestos/cotizaciones/[id]');
  }
}
