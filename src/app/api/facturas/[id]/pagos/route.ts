import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { RegistrarPagoSchema } from '@/lib/validations/facturas';
import { crearAsientoPago } from '@/lib/asientos';
import { enviarNotificacion } from '@/lib/notificaciones';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const { id } = await params;

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = RegistrarPagoSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const data = parsed.data;

    const resultado = await prisma.$transaction(async (tx) => {
      const factura = await tx.factura.findFirst({
        where: { id, empresaId, deletedAt: null },
      });

      if (!factura) throw new Error('FACTURA_NO_ENCONTRADA');
      if (factura.estado === 'ANULADA') throw new Error('FACTURA_ANULADA');
      if (factura.estado === 'BORRADOR') throw new Error('FACTURA_EN_BORRADOR');

      const saldoActual = Number(factura.saldo);
      if (data.monto > saldoActual + 0.01) {
        throw new Error('MONTO_EXCEDE_SALDO');
      }

      const pago = await tx.pagoFactura.create({
        data: {
          facturaId: id,
          empresaId,
          monto: data.monto,
          metodoPago: data.metodoPago as never,
          referencia: data.referencia ?? null,
          notas: data.notas ?? null,
          fechaPago: data.fechaPago ? new Date(data.fechaPago) : new Date(),
          registradoPor: userId,
        },
      });

      const nuevoTotalPagado = Number(factura.totalPagado) + data.monto;
      const nuevoSaldo = Math.max(0, Number(factura.total) - nuevoTotalPagado);
      const nuevoEstado = nuevoSaldo <= 0.01 ? 'PAGADA' : factura.estado;

      await tx.factura.update({
        where: { id },
        data: {
          totalPagado: nuevoTotalPagado,
          saldo: nuevoSaldo,
          estado: nuevoEstado as never,
        },
      });

      await crearAsientoPago(pago.id, id, empresaId, data.metodoPago, data.monto, userId, tx);

      return pago;
    });

    // Fire-and-forget
    if (resultado) {
      const factura = await prisma.factura.findFirst({
        where: { id, empresaId },
        select: { numero: true, clienteId: true },
      });
      const empresa = await prisma.empresa.findFirst({
        where: { id: empresaId },
        select: { nombre: true },
      });
      if (factura?.clienteId) {
        const cliente = await prisma.cliente.findFirst({
          where: { id: factura.clienteId },
          select: { nombre: true, email: true, telefono: true },
        });
        const destinatario = cliente?.email ?? cliente?.telefono;
        if (destinatario) {
          enviarNotificacion({
            empresaId,
            tipo: 'PAGO_RECIBIDO',
            datos: {
              nombre: cliente?.nombre ?? 'cliente',
              monto: data.monto.toLocaleString('es-DO', { minimumFractionDigits: 2 }),
              numero: factura.numero,
              empresa: empresa?.nombre ?? '',
            },
            destinatario,
            referencia: id,
          }).catch(console.error);
        }
      }
    }

    return ok(resultado, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'FACTURA_NO_ENCONTRADA') {
        return err('NOT_FOUND', 'Factura no encontrada.', 404);
      }
      if (error.message === 'FACTURA_ANULADA') {
        return err('INVALID_STATE', 'No se puede registrar un pago en una factura anulada.', 422);
      }
      if (error.message === 'FACTURA_EN_BORRADOR') {
        return err(
          'INVALID_STATE',
          'No se puede registrar un pago en una factura en borrador.',
          422,
        );
      }
      if (error.message === 'MONTO_EXCEDE_SALDO') {
        return err('INVALID_AMOUNT', 'El monto excede el saldo pendiente de la factura.', 422);
      }
    }
    return handleApiError(error, 'POST /api/facturas/[id]/pagos');
  }
}
