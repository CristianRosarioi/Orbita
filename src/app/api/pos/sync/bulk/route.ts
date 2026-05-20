import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { z } from 'zod';
import { calcularTotalesFactura, generarNumeroFactura } from '@/lib/facturacion';

const ItemVentaSchema = z.object({
  productoId: z.string(),
  nombre: z.string(),
  cantidad: z.coerce.number().positive(),
  precio: z.coerce.number().positive(),
  itbis: z.coerce.number().min(0),
  subtotal: z.coerce.number(),
  total: z.coerce.number(),
});

const VentaOfflineSchema = z.object({
  id: z.string(),
  clienteId: z.string().optional(),
  clienteNombre: z.string().optional(),
  items: z.array(ItemVentaSchema).min(1),
  subtotal: z.coerce.number(),
  itbis: z.coerce.number(),
  total: z.coerce.number(),
  metodoPago: z.string(),
  creadoEn: z.number(),
});

const BulkSyncSchema = z.object({
  ventas: z.array(VentaOfflineSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'Formato inválido.', 400);

    const parsed = BulkSyncSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 400);

    const { ventas } = parsed.data;
    const okIds: string[] = [];
    const errores: { id: string; error: string }[] = [];

    for (const venta of ventas) {
      try {
        await prisma.$transaction(async (tx) => {
          const { numero, numeroInt, anio } = await generarNumeroFactura(empresaId, tx);

          const totales = calcularTotalesFactura(
            venta.items.map((item) => ({
              cantidad: item.cantidad,
              precioUnitario: item.precio,
              itbisPorcentaje: item.itbis,
              descuento: 0,
            })),
            0,
          );

          await tx.factura.create({
            data: {
              empresaId,
              numero,
              numeroInt,
              anio,
              clienteId: venta.clienteId ?? null,
              clienteNombre: venta.clienteNombre ?? 'Cliente POS Offline',
              clienteIdentificacion: null,
              estado: 'PAGADA',
              metodoPago: (venta.metodoPago as never) ?? 'EFECTIVO',
              subtotal: totales.subtotal,
              itbis: totales.itbis,
              descuento: 0,
              total: totales.total,
              totalPagado: totales.total,
              saldo: 0,
              notas: `Venta offline sincronizada. ID local: ${venta.id}`,
              fechaVencimiento: null,
              creadoPor: userId,
              items: {
                create: venta.items.map((item, idx) => ({
                  productoId: null,
                  productoNombre: item.nombre,
                  productoSku: null,
                  cantidad: item.cantidad,
                  precioUnitario: item.precio,
                  itbisPorcentaje: item.itbis,
                  itbisMonto: totales.items[idx]?.itbisMonto ?? 0,
                  descuento: 0,
                  subtotal: totales.items[idx]?.subtotal ?? item.subtotal,
                  total: totales.items[idx]?.total ?? item.total,
                })),
              },
            },
          });
        });

        okIds.push(venta.id);
      } catch (e) {
        errores.push({
          id: venta.id,
          error: e instanceof Error ? e.message : 'Error al crear factura',
        });
      }
    }

    return NextResponse.json({ ok: okIds, errores });
  } catch (e) {
    return handleApiError(e);
  }
}
