import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa, getCurrentUser } from '@/lib/auth';
import { CerrarCajaSchema } from '@/lib/validations/caja';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const usuario = await getCurrentUser();
    if (!usuario) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const cajaActiva = await prisma.sesionCaja.findFirst({
      where: { empresaId, usuarioId: usuario.id, estado: 'ABIERTA' },
    });
    if (!cajaActiva) {
      return err('CAJA_NO_ABIERTA', 'No tienes una caja abierta.', 404);
    }

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = CerrarCajaSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    // Calcular el total real de ventas en efectivo de la sesión
    const pagosEfectivo = await prisma.pagoFactura.aggregate({
      where: {
        empresaId,
        metodoPago: 'EFECTIVO',
        factura: { sesionCajaId: cajaActiva.id, deletedAt: null },
      },
      _sum: { monto: true },
    });

    const totalEfectivoVentas = Number(pagosEfectivo._sum.monto ?? 0);
    const montoCierreReal = Number(cajaActiva.montoApertura) + totalEfectivoVentas;
    const diferencia = parsed.data.montoCierreDeclarado - montoCierreReal;

    const sesionCerrada = await prisma.sesionCaja.update({
      where: { id: cajaActiva.id },
      data: {
        estado: 'CERRADA',
        montoCierreDeclarado: parsed.data.montoCierreDeclarado,
        montoCierreReal,
        diferencia,
        fechaCierre: new Date(),
        notas: parsed.data.notas ?? cajaActiva.notas,
      },
    });

    return ok(sesionCerrada);
  } catch (error) {
    return handleApiError(error, 'POST /api/caja/cerrar');
  }
}
