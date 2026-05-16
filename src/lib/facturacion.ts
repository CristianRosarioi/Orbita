import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { crearAsientoFactura, crearAsientoAnulacion } from '@/lib/asientos';

// ---- Types ----
interface ItemCalculo {
  cantidad: number;
  precioUnitario: number;
  itbisPorcentaje: number;
  descuento: number;
}

interface TotalesFactura {
  subtotal: number;
  itbis: number;
  descuento: number;
  total: number;
  items: Array<{
    subtotal: number;
    itbisMonto: number;
    total: number;
  }>;
}

// Round to 2 decimal places to avoid floating point errors
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---- calcularTotalesFactura ----
export function calcularTotalesFactura(items: ItemCalculo[], descuentoGlobal = 0): TotalesFactura {
  const itemsCalculados = items.map((item) => {
    const subtotal = round2(item.cantidad * item.precioUnitario);
    const itbisMonto = round2(subtotal * (item.itbisPorcentaje / 100));
    const total = round2(subtotal + itbisMonto - item.descuento);
    return { subtotal, itbisMonto, total };
  });

  const subtotal = round2(itemsCalculados.reduce((s, i) => s + i.subtotal, 0));
  const itbis = round2(itemsCalculados.reduce((s, i) => s + i.itbisMonto, 0));
  // Sum item totals (which already include per-item discounts) then subtract global discount
  const itemsTotal = round2(itemsCalculados.reduce((s, i) => s + i.total, 0));
  const descuento = round2(descuentoGlobal);
  const total = round2(itemsTotal - descuento);

  return { subtotal, itbis, descuento, total, items: itemsCalculados };
}

// ---- obtenerOCrearSecuencia ----
export async function obtenerOCrearSecuencia(
  empresaId: string,
  anio: number,
  tx: Prisma.TransactionClient,
) {
  const existente = await tx.secuenciaFactura.findUnique({
    where: { empresaId_anio: { empresaId, anio } },
  });
  if (existente) return existente;

  return tx.secuenciaFactura.create({
    data: { empresaId, anio, prefijo: 'FAC', ultimoNumero: 0 },
  });
}

// ---- generarNumeroFactura ----
// Uses SELECT FOR UPDATE to prevent duplicate invoice numbers under concurrent load
export async function generarNumeroFactura(
  empresaId: string,
  tx: Prisma.TransactionClient,
): Promise<{ numero: string; numeroInt: number; anio: number }> {
  const anio = new Date().getFullYear();

  // Lock the sequence row for this company+year
  await tx.$executeRaw`
    INSERT INTO secuencias_factura (id, empresa_id, prefijo, anio, ultimo_numero, created_at, updated_at)
    VALUES (gen_random_uuid()::text, ${empresaId}, 'FAC', ${anio}, 0, now(), now())
    ON CONFLICT (empresa_id, anio) DO NOTHING
  `;

  const [secuencia] = await tx.$queryRaw<Array<{ id: string; ultimo_numero: number }>>`
    SELECT id, ultimo_numero FROM secuencias_factura
    WHERE empresa_id = ${empresaId} AND anio = ${anio}
    FOR UPDATE
  `;

  const nuevoNumero = (secuencia.ultimo_numero as number) + 1;

  await tx.$executeRaw`
    UPDATE secuencias_factura
    SET ultimo_numero = ${nuevoNumero}, updated_at = now()
    WHERE empresa_id = ${empresaId} AND anio = ${anio}
  `;

  const numeroInt = nuevoNumero;
  const numero = `FAC-${anio}-${String(nuevoNumero).padStart(4, '0')}`;

  return { numero, numeroInt, anio };
}

// ---- emitirFactura ----
export async function emitirFactura(
  facturaId: string,
  empresaId: string,
  usuarioClerkId: string,
  tx: Prisma.TransactionClient,
) {
  const factura = await tx.factura.findFirst({
    where: { id: facturaId, empresaId, deletedAt: null },
    include: { items: true },
  });

  if (!factura) throw new Error('FACTURA_NO_ENCONTRADA');
  if (factura.estado !== 'BORRADOR') throw new Error('SOLO_BORRADORES_SE_PUEDEN_EMITIR');

  // Baja de inventario solo para bienes
  for (const item of factura.items) {
    if (!item.productoId) continue;

    const producto = await tx.producto.findFirst({
      where: { id: item.productoId, empresaId, deletedAt: null },
    });
    if (!producto || producto.tipo !== 'BIEN') continue;

    const cantidadNum = Number(item.cantidad);
    const stockAntes = Number(producto.stockActual);
    const stockDespues = round2(stockAntes - cantidadNum);

    await tx.producto.update({
      where: { id: item.productoId },
      data: { stockActual: stockDespues },
    });

    await tx.movimientoInventario.create({
      data: {
        empresaId,
        productoId: item.productoId,
        facturaId: factura.id,
        tipo: 'VENTA',
        cantidad: -cantidadNum,
        stockAntes,
        stockDespues,
        creadoPor: usuarioClerkId,
      },
    });
  }

  // If not credit: register payment and mark as PAGADA
  const totalNum = Number(factura.total);
  let facturaActualizada;
  if (factura.metodoPago !== 'CREDITO') {
    await tx.pagoFactura.create({
      data: {
        facturaId: factura.id,
        empresaId,
        monto: totalNum,
        metodoPago: factura.metodoPago,
        registradoPor: usuarioClerkId,
      },
    });

    facturaActualizada = await tx.factura.update({
      where: { id: facturaId },
      data: {
        estado: 'PAGADA',
        totalPagado: totalNum,
        saldo: 0,
      },
    });
  } else {
    // Credit: leave as EMITIDA with full balance pending
    facturaActualizada = await tx.factura.update({
      where: { id: facturaId },
      data: { estado: 'EMITIDA' },
    });
  }

  await crearAsientoFactura(facturaId, empresaId, usuarioClerkId, tx);

  return facturaActualizada;
}

// ---- anularFactura ----
export async function anularFactura(
  facturaId: string,
  empresaId: string,
  motivo: string,
  usuarioClerkId: string,
  tx: Prisma.TransactionClient,
) {
  const factura = await tx.factura.findFirst({
    where: { id: facturaId, empresaId, deletedAt: null },
    include: { items: true },
  });

  if (!factura) throw new Error('FACTURA_NO_ENCONTRADA');
  if (factura.estado === 'ANULADA') throw new Error('FACTURA_YA_ANULADA');
  if (factura.estado === 'BORRADOR') {
    // Just cancel without inventory changes
    return tx.factura.update({
      where: { id: facturaId },
      data: { estado: 'ANULADA', anuladoPor: usuarioClerkId, motivoAnulacion: motivo },
    });
  }

  // EMITIDA or PAGADA: restore inventory
  for (const item of factura.items) {
    if (!item.productoId) continue;

    const producto = await tx.producto.findFirst({
      where: { id: item.productoId, empresaId, deletedAt: null },
    });
    if (!producto || producto.tipo !== 'BIEN') continue;

    const cantidadNum = Number(item.cantidad);
    const stockAntes = Number(producto.stockActual);
    const stockDespues = round2(stockAntes + cantidadNum);

    await tx.producto.update({
      where: { id: item.productoId },
      data: { stockActual: stockDespues },
    });

    await tx.movimientoInventario.create({
      data: {
        empresaId,
        productoId: item.productoId,
        facturaId: factura.id,
        tipo: 'DEVOLUCION',
        cantidad: cantidadNum,
        stockAntes,
        stockDespues,
        creadoPor: usuarioClerkId,
        notas: `Anulación: ${motivo}`,
      },
    });
  }

  const facturaAnulada = await tx.factura.update({
    where: { id: facturaId },
    data: { estado: 'ANULADA', anuladoPor: usuarioClerkId, motivoAnulacion: motivo },
  });

  await crearAsientoAnulacion(facturaId, empresaId, usuarioClerkId, tx);

  return facturaAnulada;
}

// ---- Export prisma for use in routes ----
export { prisma };
