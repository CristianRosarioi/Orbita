import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { MetodoPago } from '@/types/enums';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}));

vi.mock('@/lib/auth', () => ({
  requireEmpresa: vi.fn().mockResolvedValue('emp_test_id'),
}));

// Mock generarNumeroFactura and other facturacion helpers
vi.mock('@/lib/facturacion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/facturacion')>();
  return {
    ...actual,
    generarNumeroFactura: vi.fn().mockResolvedValue({
      numero: 'FAC-2026-0001',
      numeroInt: 1,
      anio: 2026,
    }),
    emitirFactura: vi.fn().mockResolvedValue({ id: 'fac_1', estado: 'PAGADA' }),
    anularFactura: vi.fn().mockResolvedValue({ id: 'fac_1', estado: 'ANULADA' }),
  };
});

type PrismaFacturaMock = {
  findMany: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  aggregate: ReturnType<typeof vi.fn>;
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    factura: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    } as PrismaFacturaMock,
    pagoFactura: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: unknown) => Promise<unknown>) => cb({})),
  },
}));

const itemValido = {
  productoNombre: 'Servicio de prueba',
  cantidad: 1,
  precioUnitario: 100,
  itbisPorcentaje: 18,
  descuento: 0,
};

const facturaValida = {
  clienteNombre: 'Juan Pérez',
  metodoPago: MetodoPago.EFECTIVO,
  items: [itemValido],
};

describe('GET /api/facturas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve lista paginada con 200', async () => {
    const { prisma } = await import('@/lib/prisma');
    const mockFacturas = [
      {
        id: 'fac_1',
        numero: 'FAC-2026-0001',
        clienteNombre: 'Juan Pérez',
        fechaEmision: new Date(),
        metodoPago: 'EFECTIVO',
        total: 118,
        estado: 'PAGADA',
        saldo: 0,
      },
    ];
    (prisma.factura as PrismaFacturaMock).findMany.mockResolvedValue(mockFacturas);
    (prisma.factura as PrismaFacturaMock).count.mockResolvedValue(1);

    const { GET } = await import('@/app/api/facturas/route');
    const req = new NextRequest('http://localhost/api/facturas');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.total).toBe(1);
  });
});

describe('POST /api/facturas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza body vacío con 400', async () => {
    const { POST } = await import('@/app/api/facturas/route');
    const req = new Request('http://localhost/api/facturas', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('rechaza items vacíos con 422', async () => {
    const { POST } = await import('@/app/api/facturas/route');
    const req = new Request('http://localhost/api/facturas', {
      method: 'POST',
      body: JSON.stringify({ ...facturaValida, items: [] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('crea factura con datos válidos y devuelve 201', async () => {
    const { prisma } = await import('@/lib/prisma');
    const mockFactura = {
      id: 'fac_1',
      numero: 'FAC-2026-0001',
      estado: 'BORRADOR',
      items: [],
    };
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (tx: unknown) => Promise<unknown>) => cb(prisma),
    );
    (prisma.factura as PrismaFacturaMock).create.mockResolvedValue(mockFactura);

    const { POST } = await import('@/app/api/facturas/route');
    const req = new Request('http://localhost/api/facturas', {
      method: 'POST',
      body: JSON.stringify(facturaValida),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('fac_1');
  });
});

describe('POST /api/facturas/[id]/emitir', () => {
  beforeEach(() => vi.clearAllMocks());

  it('emite la factura y devuelve 200', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (tx: unknown) => Promise<unknown>) => cb(prisma),
    );

    const { POST } = await import('@/app/api/facturas/[id]/emitir/route');
    const req = new NextRequest('http://localhost/api/facturas/fac_1/emitir', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'fac_1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.estado).toBe('PAGADA');
  });
});

describe('POST /api/facturas/[id]/anular', () => {
  beforeEach(() => vi.clearAllMocks());

  it('anula con motivo válido y devuelve 200', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (tx: unknown) => Promise<unknown>) => cb(prisma),
    );

    const { POST } = await import('@/app/api/facturas/[id]/anular/route');
    const req = new Request('http://localhost/api/facturas/fac_1/anular', {
      method: 'POST',
      body: JSON.stringify({ motivo: 'Factura emitida por error en los datos del cliente' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, { params: Promise.resolve({ id: 'fac_1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.estado).toBe('ANULADA');
  });

  it('rechaza motivo muy corto con 422', async () => {
    const { POST } = await import('@/app/api/facturas/[id]/anular/route');
    const req = new Request('http://localhost/api/facturas/fac_1/anular', {
      method: 'POST',
      body: JSON.stringify({ motivo: 'Corto' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, { params: Promise.resolve({ id: 'fac_1' }) });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza body sin motivo con 422', async () => {
    const { POST } = await import('@/app/api/facturas/[id]/anular/route');
    const req = new Request('http://localhost/api/facturas/fac_1/anular', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, { params: Promise.resolve({ id: 'fac_1' }) });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
