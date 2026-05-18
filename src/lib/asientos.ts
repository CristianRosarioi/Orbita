import type { Prisma } from '@/generated/prisma/client';

// ---- helpers ----

async function encontrarCuenta(
  empresaId: string,
  codigo: string,
  tx: Prisma.TransactionClient,
): Promise<string> {
  const cuenta = await tx.cuentaContable.findFirst({
    where: { empresaId, codigo, deletedAt: null },
    select: { id: true },
  });
  if (!cuenta) throw new Error(`CUENTA_NO_ENCONTRADA:${codigo}`);
  return cuenta.id;
}

async function siguienteNumeroAsiento(
  empresaId: string,
  tx: Prisma.TransactionClient,
): Promise<number> {
  const ultimo = await tx.asientoContable.findFirst({
    where: { empresaId },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });
  return (ultimo?.numero ?? 0) + 1;
}

// Cuenta de caja/banco según método de pago
function cuentaEfectivoOBanco(metodoPago: string): string {
  if (metodoPago === 'TARJETA' || metodoPago === 'TRANSFERENCIA') return '1102';
  return '1101';
}

// ---- crearAsientoFactura ----
// Crea el asiento contable cuando se emite una factura.
// Doble partida: débitos = créditos.
export async function crearAsientoFactura(
  facturaId: string,
  empresaId: string,
  usuarioClerkId: string,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const factura = await tx.factura.findFirst({
    where: { id: facturaId, empresaId, deletedAt: null },
    include: { items: { include: { producto: true } } },
  });
  if (!factura) return;

  const total = Number(factura.total);
  const subtotal = Number(factura.subtotal);
  const itbis = Number(factura.itbis);
  const descuento = Number(factura.descuento);

  if (total <= 0) return;

  const numero = await siguienteNumeroAsiento(empresaId, tx);

  // Determinar si hay bienes o servicios para separar ingresos
  const tieneServicios = factura.items.some((i) => i.producto?.tipo === 'SERVICIO');
  const tieneBienes = factura.items.some((i) => !i.producto || i.producto.tipo === 'BIEN');

  // Calcular subtotales por tipo de producto
  let subtotalBienes = 0;
  let subtotalServicios = 0;
  for (const item of factura.items) {
    const itemSubtotal = Number(item.subtotal);
    if (item.producto?.tipo === 'SERVICIO') {
      subtotalServicios += itemSubtotal;
    } else {
      subtotalBienes += itemSubtotal;
    }
  }

  const esCredito = factura.metodoPago === 'CREDITO';
  const cuentaDebitoId = esCredito
    ? await encontrarCuenta(empresaId, '1103', tx) // CxC Clientes
    : await encontrarCuenta(empresaId, cuentaEfectivoOBanco(factura.metodoPago), tx);

  const lineas: {
    cuentaId: string;
    tipo: 'DEBITO' | 'CREDITO';
    monto: number;
    descripcion: string;
  }[] = [];

  // DÉBITO: cuenta de caja/banco/CxC por el total
  lineas.push({
    cuentaId: cuentaDebitoId,
    tipo: 'DEBITO',
    monto: total,
    descripcion: `Factura ${factura.numero}`,
  });

  // CRÉDITO: ventas de bienes
  if (tieneBienes && subtotalBienes > 0) {
    lineas.push({
      cuentaId: await encontrarCuenta(empresaId, '4001', tx),
      tipo: 'CREDITO',
      monto: subtotalBienes,
      descripcion: `Ventas bienes — ${factura.numero}`,
    });
  }

  // CRÉDITO: ventas de servicios
  if (tieneServicios && subtotalServicios > 0) {
    lineas.push({
      cuentaId: await encontrarCuenta(empresaId, '4002', tx),
      tipo: 'CREDITO',
      monto: subtotalServicios,
      descripcion: `Ventas servicios — ${factura.numero}`,
    });
  }

  // Si no se separó correctamente (sin producto), usar 4001 por defecto
  if (!tieneBienes && !tieneServicios) {
    lineas.push({
      cuentaId: await encontrarCuenta(empresaId, '4001', tx),
      tipo: 'CREDITO',
      monto: subtotal,
      descripcion: `Ventas — ${factura.numero}`,
    });
  }

  // CRÉDITO: ITBIS por pagar
  if (itbis > 0) {
    lineas.push({
      cuentaId: await encontrarCuenta(empresaId, '2102', tx),
      tipo: 'CREDITO',
      monto: itbis,
      descripcion: `ITBIS — ${factura.numero}`,
    });
  }

  // DÉBITO: descuento en ventas (contra-cuenta de ingresos)
  if (descuento > 0) {
    lineas.push({
      cuentaId: await encontrarCuenta(empresaId, '4003', tx),
      tipo: 'DEBITO',
      monto: descuento,
      descripcion: `Descuento — ${factura.numero}`,
    });
  }

  const asiento = await tx.asientoContable.create({
    data: {
      empresaId,
      numero,
      descripcion: `Venta ${factura.numero} — ${factura.clienteNombre}`,
      facturaId: factura.id,
      creadoPor: usuarioClerkId,
    },
  });

  await tx.lineaAsiento.createMany({
    data: lineas.map((l) => ({
      asientoId: asiento.id,
      cuentaId: l.cuentaId,
      tipo: l.tipo,
      monto: l.monto,
      descripcion: l.descripcion,
    })),
  });
}

// ---- crearAsientoPago ----
// Cuando se registra un pago de factura a crédito: CxC → Caja/Banco
export async function crearAsientoPago(
  pagoId: string,
  facturaId: string,
  empresaId: string,
  metodoPago: string,
  monto: number,
  usuarioClerkId: string,
  tx: Prisma.TransactionClient,
): Promise<void> {
  if (monto <= 0) return;

  const factura = await tx.factura.findFirst({
    where: { id: facturaId, empresaId, deletedAt: null },
    select: { numero: true, clienteNombre: true },
  });
  if (!factura) return;

  const numero = await siguienteNumeroAsiento(empresaId, tx);

  const [cuentaCaja, cuentaCxC] = await Promise.all([
    encontrarCuenta(empresaId, cuentaEfectivoOBanco(metodoPago), tx),
    encontrarCuenta(empresaId, '1103', tx),
  ]);

  const asiento = await tx.asientoContable.create({
    data: {
      empresaId,
      numero,
      descripcion: `Cobro factura ${factura.numero} — ${factura.clienteNombre}`,
      facturaId,
      pagoId,
      creadoPor: usuarioClerkId,
    },
  });

  await tx.lineaAsiento.createMany({
    data: [
      {
        asientoId: asiento.id,
        cuentaId: cuentaCaja,
        tipo: 'DEBITO',
        monto,
        descripcion: `Cobro — ${factura.numero}`,
      },
      {
        asientoId: asiento.id,
        cuentaId: cuentaCxC,
        tipo: 'CREDITO',
        monto,
        descripcion: `Cobro — ${factura.numero}`,
      },
    ],
  });
}

// ---- crearAsientoCompra ----
// Al recibir una orden de compra: Inventario/ITBIS por Cobrar ← Cuentas por Pagar
export async function crearAsientoCompra(
  ordenCompraId: string,
  empresaId: string,
  usuarioClerkId: string,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const orden = await tx.ordenCompra.findFirst({
    where: { id: ordenCompraId, empresaId },
    include: { items: { include: { producto: true } } },
  });
  if (!orden) return;

  const subtotal = Number(orden.subtotal);
  const itbis = Number(orden.itbis);
  const total = Number(orden.total);
  if (total <= 0) return;

  const numero = await siguienteNumeroAsiento(empresaId, tx);

  const lineas: { cuentaId: string; tipo: 'DEBITO' | 'CREDITO'; monto: number; descripcion: string }[] = [];

  // DÉBITO: 1105 Inventario (bienes recibidos)
  if (subtotal > 0) {
    lineas.push({
      cuentaId: await encontrarCuenta(empresaId, '1105', tx),
      tipo: 'DEBITO',
      monto: subtotal,
      descripcion: `Compra OC-${orden.numero} — inventario`,
    });
  }

  // DÉBITO: 1104 ITBIS por cobrar
  if (itbis > 0) {
    lineas.push({
      cuentaId: await encontrarCuenta(empresaId, '1104', tx),
      tipo: 'DEBITO',
      monto: itbis,
      descripcion: `ITBIS compra OC-${orden.numero}`,
    });
  }

  // CRÉDITO: 2101 Cuentas por pagar proveedores
  lineas.push({
    cuentaId: await encontrarCuenta(empresaId, '2101', tx),
    tipo: 'CREDITO',
    monto: total,
    descripcion: `Proveedor OC-${orden.numero}`,
  });

  const asiento = await tx.asientoContable.create({
    data: {
      empresaId,
      numero,
      descripcion: `Recepción orden de compra OC-${orden.numero}`,
      ordenCompraId,
      creadoPor: usuarioClerkId,
    },
  });

  await tx.lineaAsiento.createMany({
    data: lineas.map((l) => ({
      asientoId: asiento.id,
      cuentaId: l.cuentaId,
      tipo: l.tipo,
      monto: l.monto,
      descripcion: l.descripcion,
    })),
  });
}

// ---- crearAsientoGasto ----
// Al registrar un gasto: Gastos/ITBIS por Cobrar ← Cuentas por Pagar
export async function crearAsientoGasto(
  gastoId: string,
  empresaId: string,
  usuarioClerkId: string,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const gasto = await tx.gasto.findFirst({
    where: { id: gastoId, empresaId },
  });
  if (!gasto) return;

  const monto = Number(gasto.monto);
  const itbis = Number(gasto.itbis);
  const total = Number(gasto.total);
  if (total <= 0) return;

  const numero = await siguienteNumeroAsiento(empresaId, tx);

  const lineas: { cuentaId: string; tipo: 'DEBITO' | 'CREDITO'; monto: number; descripcion: string }[] = [];

  // DÉBITO: 5002 Gastos operacionales
  if (monto > 0) {
    lineas.push({
      cuentaId: await encontrarCuenta(empresaId, '5002', tx),
      tipo: 'DEBITO',
      monto,
      descripcion: `Gasto: ${gasto.descripcion}`,
    });
  }

  // DÉBITO: 1104 ITBIS por cobrar
  if (itbis > 0) {
    lineas.push({
      cuentaId: await encontrarCuenta(empresaId, '1104', tx),
      tipo: 'DEBITO',
      monto: itbis,
      descripcion: `ITBIS gasto: ${gasto.descripcion}`,
    });
  }

  // CRÉDITO: 2101 Cuentas por pagar proveedores
  lineas.push({
    cuentaId: await encontrarCuenta(empresaId, '2101', tx),
    tipo: 'CREDITO',
    monto: total,
    descripcion: `Por pagar: ${gasto.descripcion}`,
  });

  const asiento = await tx.asientoContable.create({
    data: {
      empresaId,
      numero,
      descripcion: `Gasto registrado — ${gasto.descripcion}`,
      gastoId,
      creadoPor: usuarioClerkId,
    },
  });

  await tx.lineaAsiento.createMany({
    data: lineas.map((l) => ({
      asientoId: asiento.id,
      cuentaId: l.cuentaId,
      tipo: l.tipo,
      monto: l.monto,
      descripcion: l.descripcion,
    })),
  });
}

// ---- crearAsientoAnulacion ----
// Reverso exacto del asiento original de la factura.
export async function crearAsientoAnulacion(
  facturaId: string,
  empresaId: string,
  usuarioClerkId: string,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const asientoOriginal = await tx.asientoContable.findFirst({
    where: { facturaId, empresaId },
    include: { lineas: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!asientoOriginal || asientoOriginal.lineas.length === 0) return;

  const factura = await tx.factura.findFirst({
    where: { id: facturaId, empresaId },
    select: { numero: true },
  });

  const numero = await siguienteNumeroAsiento(empresaId, tx);

  const asiento = await tx.asientoContable.create({
    data: {
      empresaId,
      numero,
      descripcion: `Anulación ${factura?.numero ?? facturaId}`,
      facturaId,
      creadoPor: usuarioClerkId,
    },
  });

  // Reverso: DEBITO → CREDITO y viceversa
  await tx.lineaAsiento.createMany({
    data: asientoOriginal.lineas.map((l) => ({
      asientoId: asiento.id,
      cuentaId: l.cuentaId,
      tipo: l.tipo === 'DEBITO' ? ('CREDITO' as const) : ('DEBITO' as const),
      monto: Number(l.monto),
      descripcion: `Reverso — ${l.descripcion ?? ''}`,
    })),
  });
}
