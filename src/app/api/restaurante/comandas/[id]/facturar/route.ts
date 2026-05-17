import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { generarNumeroFactura } from '@/lib/facturacion';
import { z } from 'zod';

const INDUSTRIAS_RESTAURANTE = ['RESTAURANTE'];

const FacturarComandaSchema = z.object({
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO']),
  clienteId: z.string().optional(),
  clienteNombre: z.string().default('Consumidor Final'),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_RESTAURANTE.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const { id } = await params;
    const empresaId = sesion.empresaActivaId;

    const comanda = await prisma.comanda.findFirst({
      where: { id, empresaId },
      include: { items: { where: { estado: { not: 'CANCELADO' } } } },
    });

    if (!comanda) return err('NOT_FOUND', 'Comanda no encontrada.', 404);
    if (comanda.estado === 'CANCELADA') return err('VALIDATION_ERROR', 'No se puede facturar una comanda cancelada.', 422);
    if (comanda.facturaId) return err('VALIDATION_ERROR', 'Esta comanda ya fue facturada.', 422);
    if (comanda.items.length === 0) return err('VALIDATION_ERROR', 'La comanda no tiene ítems activos.', 422);

    const body = await req.json();
    const parsed = FacturarComandaSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const factura = await prisma.$transaction(async (tx) => {
      const { numero, numeroInt, anio } = await generarNumeroFactura(empresaId, tx as never);

      const nuevaFactura = await tx.factura.create({
        data: {
          empresaId,
          numero,
          numeroInt,
          anio,
          clienteId: parsed.data.clienteId,
          clienteNombre: parsed.data.clienteNombre,
          metodoPago: parsed.data.metodoPago,
          estado: parsed.data.metodoPago === 'CREDITO' ? 'EMITIDA' : 'PAGADA',
          subtotal: comanda.subtotal,
          itbis: comanda.itbis,
          descuento: 0,
          total: comanda.total,
          saldo: parsed.data.metodoPago === 'CREDITO' ? comanda.total : 0,
          creadoPor: userId,
          items: {
            create: comanda.items.map((item) => ({
              productoId: item.productoId,
              productoNombre: item.nombre,
              cantidad: item.cantidad,
              precioUnitario: item.precio,
              itbisPorcentaje: 18,
              itbisMonto: Math.round(Number(item.cantidad) * Number(item.precio) * 0.18 * 100) / 100,
              descuento: 0,
              subtotal: Math.round(Number(item.cantidad) * Number(item.precio) * 100) / 100,
              total: Math.round(Number(item.cantidad) * Number(item.precio) * 1.18 * 100) / 100,
            })),
          },
        },
      });

      // Vincular comanda con factura y marcarla como servida
      await tx.comanda.update({
        where: { id },
        data: { facturaId: nuevaFactura.id, estado: 'SERVIDA' },
      });

      // Liberar la mesa
      if (comanda.mesaId) {
        await tx.mesa.update({
          where: { id: comanda.mesaId },
          data: { estado: 'DISPONIBLE' },
        });
      }

      return nuevaFactura;
    });

    return ok({ facturaId: factura.id, numero: factura.numero });
  } catch (error) {
    return handleApiError(error, 'POST /api/restaurante/comandas/[id]/facturar');
  }
}
