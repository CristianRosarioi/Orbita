import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearAsientoFactura, crearAsientoPago, crearAsientoAnulacion } from '@/lib/asientos';
import type { Prisma } from '@/generated/prisma/client';

// ---- minimal tx mock factory ----

function makeCuenta(id: string) {
  return { id };
}

function makeTx(overrides: Partial<Record<string, unknown>> = {}): Prisma.TransactionClient {
  const cuentas: Record<string, string> = {
    '1101': 'c-1101',
    '1102': 'c-1102',
    '1103': 'c-1103',
    '2102': 'c-2102',
    '4001': 'c-4001',
    '4002': 'c-4002',
    '4003': 'c-4003',
  };

  const capturedLineas: unknown[] = [];
  let asientoId = 'asiento-1';

  return {
    cuentaContable: {
      findFirst: vi.fn(({ where }: { where: { codigo: string } }) => {
        const id = cuentas[where.codigo];
        return id ? Promise.resolve(makeCuenta(id)) : Promise.resolve(null);
      }),
    },
    asientoContable: {
      findFirst: vi.fn(() => Promise.resolve({ numero: 0 })),
      create: vi.fn(({ data }: { data: { id?: string } }) => {
        return Promise.resolve({ id: asientoId, ...data });
      }),
    },
    lineaAsiento: {
      createMany: vi.fn(({ data }: { data: unknown[] }) => {
        capturedLineas.push(...data);
        return Promise.resolve({ count: data.length });
      }),
    },
    factura: {
      findFirst: vi.fn(),
    },
    ...overrides,
    _capturedLineas: capturedLineas,
  } as unknown as Prisma.TransactionClient;
}

// ---- crearAsientoFactura ----

describe('crearAsientoFactura', () => {
  it('débitos === créditos para factura de bienes con ITBIS', async () => {
    const total    = 11800;
    const subtotal = 10000;
    const itbis    = 1800;

    const tx = makeTx({
      factura: {
        findFirst: vi.fn(() =>
          Promise.resolve({
            id: 'f1',
            numero: 'FAC-2026-0001',
            clienteNombre: 'Cliente Test',
            total,
            subtotal,
            itbis,
            descuento: 0,
            metodoPago: 'EFECTIVO',
            items: [{ producto: { tipo: 'BIEN' }, subtotal }],
          }),
        ),
      },
    });

    await crearAsientoFactura('f1', 'emp1', 'user1', tx);

    const lineas = (tx as unknown as { _capturedLineas: Array<{ tipo: string; monto: number }> })._capturedLineas;
    const debitos  = lineas.filter((l) => l.tipo === 'DEBITO').reduce((s, l) => s + l.monto, 0);
    const creditos = lineas.filter((l) => l.tipo === 'CREDITO').reduce((s, l) => s + l.monto, 0);

    expect(Math.abs(debitos - creditos)).toBeLessThan(0.01);
  });

  it('débitos === créditos para factura mixta (bienes + servicios) con descuento', async () => {
    // subtotal=17000, itbis=2160, descuento=1100 → total=18060
    const tx = makeTx({
      factura: {
        findFirst: vi.fn(() =>
          Promise.resolve({
            id: 'f2',
            numero: 'FAC-2026-0002',
            clienteNombre: 'Mix Test',
            total: 18060,
            subtotal: 17000,
            itbis: 2160,
            descuento: 1100,
            metodoPago: 'TRANSFERENCIA',
            items: [
              { producto: { tipo: 'BIEN' }, subtotal: 10000 },
              { producto: { tipo: 'SERVICIO' }, subtotal: 7000 },
            ],
          }),
        ),
      },
    });

    await crearAsientoFactura('f2', 'emp1', 'user1', tx);

    const lineas = (tx as unknown as { _capturedLineas: Array<{ tipo: string; monto: number }> })._capturedLineas;
    const debitos  = lineas.filter((l) => l.tipo === 'DEBITO').reduce((s, l) => s + l.monto, 0);
    const creditos = lineas.filter((l) => l.tipo === 'CREDITO').reduce((s, l) => s + l.monto, 0);

    expect(Math.abs(debitos - creditos)).toBeLessThan(0.01);
  });

  it('usa cuenta CxC (1103) para facturas a crédito', async () => {
    const tx = makeTx({
      factura: {
        findFirst: vi.fn(() =>
          Promise.resolve({
            id: 'f3',
            numero: 'FAC-2026-0003',
            clienteNombre: 'Crédito Test',
            total: 5000,
            subtotal: 5000,
            itbis: 0,
            descuento: 0,
            metodoPago: 'CREDITO',
            items: [{ producto: { tipo: 'BIEN' }, subtotal: 5000 }],
          }),
        ),
      },
    });

    await crearAsientoFactura('f3', 'emp1', 'user1', tx);

    const lineas = (tx as unknown as { _capturedLineas: Array<{ tipo: string; monto: number; cuentaId: string }> })._capturedLineas;
    const debitoLine = lineas.find((l) => l.tipo === 'DEBITO');
    expect(debitoLine?.cuentaId).toBe('c-1103');
  });

  it('no crea asiento si factura tiene total 0', async () => {
    const tx = makeTx({
      factura: {
        findFirst: vi.fn(() =>
          Promise.resolve({
            id: 'f4',
            numero: 'FAC-2026-0004',
            clienteNombre: 'Zero',
            total: 0,
            subtotal: 0,
            itbis: 0,
            descuento: 0,
            metodoPago: 'EFECTIVO',
            items: [],
          }),
        ),
      },
    });

    await crearAsientoFactura('f4', 'emp1', 'user1', tx);

    const createMock = tx.asientoContable.create as ReturnType<typeof vi.fn>;
    expect(createMock).not.toHaveBeenCalled();
  });
});

// ---- crearAsientoPago ----

describe('crearAsientoPago', () => {
  it('débitos === créditos en asiento de pago', async () => {
    const monto = 3500;
    const tx = makeTx({
      factura: {
        findFirst: vi.fn(() =>
          Promise.resolve({ numero: 'FAC-2026-0001', clienteNombre: 'Cliente' }),
        ),
      },
    });

    await crearAsientoPago('pago1', 'f1', 'emp1', 'EFECTIVO', monto, 'user1', tx);

    const lineas = (tx as unknown as { _capturedLineas: Array<{ tipo: string; monto: number }> })._capturedLineas;
    const debitos  = lineas.filter((l) => l.tipo === 'DEBITO').reduce((s, l) => s + l.monto, 0);
    const creditos = lineas.filter((l) => l.tipo === 'CREDITO').reduce((s, l) => s + l.monto, 0);

    expect(Math.abs(debitos - creditos)).toBeLessThan(0.01);
    expect(debitos).toBe(monto);
  });

  it('usa cuenta Banco (1102) para pago con TARJETA', async () => {
    const tx = makeTx({
      factura: {
        findFirst: vi.fn(() =>
          Promise.resolve({ numero: 'FAC-2026-0001', clienteNombre: 'Cliente' }),
        ),
      },
    });

    await crearAsientoPago('pago2', 'f1', 'emp1', 'TARJETA', 1000, 'user1', tx);

    const lineas = (tx as unknown as { _capturedLineas: Array<{ tipo: string; monto: number; cuentaId: string }> })._capturedLineas;
    const debitoLine = lineas.find((l) => l.tipo === 'DEBITO');
    expect(debitoLine?.cuentaId).toBe('c-1102');
  });

  it('no crea asiento si monto es 0', async () => {
    const tx = makeTx({
      factura: { findFirst: vi.fn() },
    });

    await crearAsientoPago('pago3', 'f1', 'emp1', 'EFECTIVO', 0, 'user1', tx);

    const createMock = tx.asientoContable.create as ReturnType<typeof vi.fn>;
    expect(createMock).not.toHaveBeenCalled();
  });
});

// ---- crearAsientoAnulacion ----

describe('crearAsientoAnulacion', () => {
  it('reversa exactamente las líneas del asiento original', async () => {
    const lineasOriginales = [
      { cuentaId: 'c-1101', tipo: 'DEBITO',  monto: '11800', descripcion: 'Factura' },
      { cuentaId: 'c-4001', tipo: 'CREDITO', monto: '10000', descripcion: 'Ventas' },
      { cuentaId: 'c-2102', tipo: 'CREDITO', monto: '1800',  descripcion: 'ITBIS' },
    ];

    const tx = makeTx({
      asientoContable: {
        findFirst: vi.fn((args: { orderBy?: unknown }) => {
          // first call: findFirst for original asiento
          if (args && 'orderBy' in args) {
            return Promise.resolve({ id: 'a1', lineas: lineasOriginales });
          }
          return Promise.resolve({ numero: 5 });
        }),
        create: vi.fn(() => Promise.resolve({ id: 'a2' })),
      },
      factura: {
        findFirst: vi.fn(() => Promise.resolve({ numero: 'FAC-2026-0001' })),
      },
    });

    await crearAsientoAnulacion('f1', 'emp1', 'user1', tx);

    const lineas = (tx as unknown as { _capturedLineas: Array<{ tipo: string; monto: number; cuentaId: string }> })._capturedLineas;

    // Verificar que cada línea original fue reversada
    const caja = lineas.find((l) => l.cuentaId === 'c-1101');
    expect(caja?.tipo).toBe('CREDITO'); // original era DEBITO

    const ventas = lineas.find((l) => l.cuentaId === 'c-4001');
    expect(ventas?.tipo).toBe('DEBITO'); // original era CREDITO

    const debitos  = lineas.reduce((s, l) => s + (l.tipo === 'DEBITO'  ? Number(l.monto) : 0), 0);
    const creditos = lineas.reduce((s, l) => s + (l.tipo === 'CREDITO' ? Number(l.monto) : 0), 0);
    expect(Math.abs(debitos - creditos)).toBeLessThan(0.01);
  });

  it('no hace nada si no existe asiento original', async () => {
    const tx = makeTx({
      asientoContable: {
        findFirst: vi.fn(() => Promise.resolve(null)),
        create: vi.fn(),
      },
      factura: {
        findFirst: vi.fn(() => Promise.resolve({ numero: 'FAC-2026-0001' })),
      },
    });

    await crearAsientoAnulacion('f-sin-asiento', 'emp1', 'user1', tx);

    const createMock = tx.asientoContable.create as ReturnType<typeof vi.fn>;
    expect(createMock).not.toHaveBeenCalled();
  });
});
