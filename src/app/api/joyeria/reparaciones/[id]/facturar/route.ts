import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { generarNumeroFactura, calcularTotalesFactura } from '@/lib/facturacion';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const reparacion = await prisma.reparacionJoya.findFirst({
      where: { id, empresaId },
    });
    if (!reparacion) return err('NOT_FOUND', 'Reparación no encontrada.', 404);
    if (reparacion.estado !== 'LISTA')
      return err('CONFLICT', 'Solo se pueden facturar reparaciones en estado LISTA.', 409);
    if (reparacion.facturaId) return err('CONFLICT', 'Esta reparación ya fue facturada.', 409);

    const costo = Number(reparacion.costoFinal ?? reparacion.presupuesto ?? 0);
    if (costo <= 0)
      return err('VALIDATION_ERROR', 'Debes registrar el costo final antes de facturar.', 422);

    const factura = await prisma.$transaction(async (tx) => {
      const { numero, numeroInt, anio } = await generarNumeroFactura(empresaId, tx);
      const totales = calcularTotalesFactura(
        [{ cantidad: 1, precioUnitario: costo, itbisPorcentaje: 18, descuento: 0 }],
        0,
      );

      const f = await tx.factura.create({
        data: {
          empresaId,
          numero,
          numeroInt,
          anio,
          clienteId: reparacion.clienteId ?? null,
          clienteNombre: reparacion.clienteNombre,
          clienteIdentificacion: null,
          estado: 'PAGADA',
          metodoPago: 'EFECTIVO',
          subtotal: totales.subtotal,
          itbis: totales.itbis,
          descuento: 0,
          total: totales.total,
          totalPagado: totales.total,
          saldo: 0,
          notas: `Reparación de joya — ${reparacion.descripcion}`,
          fechaVencimiento: null,
          creadoPor: userId,
          items: {
            create: [
              {
                productoId: null,
                productoNombre: `Reparación: ${reparacion.descripcion}`,
                productoSku: null,
                cantidad: 1,
                precioUnitario: costo,
                itbisPorcentaje: 18,
                itbisMonto: totales.items[0]?.itbisMonto ?? 0,
                descuento: 0,
                subtotal: totales.items[0]?.subtotal ?? costo,
                total: totales.items[0]?.total ?? costo,
              },
            ],
          },
        },
      });

      await tx.reparacionJoya.update({
        where: { id },
        data: { facturaId: f.id, estado: 'ENTREGADA', fechaEntrega: new Date() },
      });

      if (reparacion.piezaId) {
        await tx.piezaJoya.update({
          where: { id: reparacion.piezaId },
          data: { estado: 'EN_VITRINA' },
        });
      }

      return f;
    });

    return ok(factura, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
