import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa, getCurrentUser } from '@/lib/auth';

export async function GET() {
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

    const facturas = await prisma.factura.findMany({
      where: { empresaId, sesionCajaId: cajaActiva.id, deletedAt: null, estado: { not: 'ANULADA' } },
      include: { pagos: true },
    });

    // Calcular totales por método de pago
    const metodos: Record<string, number> = {
      EFECTIVO: 0,
      TARJETA: 0,
      TRANSFERENCIA: 0,
      CHEQUE: 0,
    };

    let totalVendido = 0;
    for (const factura of facturas) {
      totalVendido += Number(factura.total);
      for (const pago of factura.pagos) {
        const mp = pago.metodoPago as string;
        metodos[mp] = (metodos[mp] ?? 0) + Number(pago.monto);
      }
    }

    return ok({
      sesion: cajaActiva,
      totalVendido,
      cantidadFacturas: facturas.length,
      desglosePorMetodo: metodos,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/caja/resumen');
  }
}
