import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}));

vi.mock('@/lib/auth', () => ({
  requireEmpresa: vi.fn().mockResolvedValue('emp_test_id'),
}));

vi.mock('@/lib/facturacion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/facturacion')>();
  return {
    ...actual,
    generarNumeroFactura: vi
      .fn()
      .mockResolvedValue({ numero: 'FAC-2026-0001', numeroInt: 1, anio: 2026 }),
  };
});

const mockFacturaCreate = vi.fn().mockResolvedValue({ id: 'fac_1', numero: 'FAC-2026-0001' });

const mockPrisma = {
  piezaJoya: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  reparacionJoya: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  factura: {
    create: mockFacturaCreate,
  },
  $transaction: vi.fn((cb: (tx: unknown) => Promise<unknown>) =>
    cb({
      piezaJoya: { update: vi.fn() },
      reparacionJoya: { create: vi.fn().mockResolvedValue({ id: 'rep_1' }), update: vi.fn() },
      factura: { create: mockFacturaCreate },
    }),
  ),
};

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

// ─── POST /api/joyeria/inventario ────────────────────────────────────────────

describe('POST /api/joyeria/inventario', () => {
  beforeEach(() => vi.clearAllMocks());

  const piezaValida = {
    codigo: 'JY-0001',
    nombre: 'Anillo solitario 18K',
    tipo: 'Anillo',
    material: 'ORO_18K',
    precioVenta: 25000,
  };

  it('crea pieza con datos válidos y devuelve 201', async () => {
    mockPrisma.piezaJoya.findUnique.mockResolvedValue(null);
    mockPrisma.piezaJoya.create.mockResolvedValue({ id: 'p1', ...piezaValida });

    const { POST } = await import('@/app/api/joyeria/inventario/route');
    const req = new NextRequest('http://localhost/api/joyeria/inventario', {
      method: 'POST',
      body: JSON.stringify(piezaValida),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('el precio de venta debe ser mayor que 0', async () => {
    const { POST } = await import('@/app/api/joyeria/inventario/route');
    const req = new NextRequest('http://localhost/api/joyeria/inventario', {
      method: 'POST',
      body: JSON.stringify({ ...piezaValida, precioVenta: 0 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.message).toContain('mayor que 0');
  });

  it('rechaza código duplicado con 409', async () => {
    mockPrisma.piezaJoya.findUnique.mockResolvedValue({ id: 'existing' });

    const { POST } = await import('@/app/api/joyeria/inventario/route');
    const req = new NextRequest('http://localhost/api/joyeria/inventario', {
      method: 'POST',
      body: JSON.stringify(piezaValida),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('falla con material inválido', async () => {
    const { POST } = await import('@/app/api/joyeria/inventario/route');
    const req = new NextRequest('http://localhost/api/joyeria/inventario', {
      method: 'POST',
      body: JSON.stringify({ ...piezaValida, material: 'COBRE' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

// ─── POST /api/joyeria/reparaciones ──────────────────────────────────────────

describe('POST /api/joyeria/reparaciones', () => {
  beforeEach(() => vi.clearAllMocks());

  const reparacionValida = {
    clienteNombre: 'María González',
    descripcion: 'Reducir talla del anillo de 8 a 6',
  };

  it('crea reparación con datos válidos', async () => {
    const { POST } = await import('@/app/api/joyeria/reparaciones/route');
    const req = new NextRequest('http://localhost/api/joyeria/reparaciones', {
      method: 'POST',
      body: JSON.stringify(reparacionValida),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('falla si no hay nombre de cliente', async () => {
    const { POST } = await import('@/app/api/joyeria/reparaciones/route');
    const req = new NextRequest('http://localhost/api/joyeria/reparaciones', {
      method: 'POST',
      body: JSON.stringify({ ...reparacionValida, clienteNombre: '' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

// ─── POST /api/joyeria/reparaciones/[id]/facturar ────────────────────────────

describe('POST /api/joyeria/reparaciones/[id]/facturar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFacturaCreate.mockResolvedValue({ id: 'fac_1', numero: 'FAC-2026-0001' });
  });

  it('no factura si la reparación no está en estado LISTA', async () => {
    mockPrisma.reparacionJoya.findFirst.mockResolvedValue({
      id: 'rep_1',
      empresaId: 'emp_test_id',
      estado: 'EN_PROCESO',
      facturaId: null,
    });

    const { POST } = await import('@/app/api/joyeria/reparaciones/[id]/facturar/route');
    const req = new NextRequest('http://localhost/api/joyeria/reparaciones/rep_1/facturar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'rep_1' }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.message).toContain('LISTA');
  });

  it('no factura si ya tiene facturaId', async () => {
    mockPrisma.reparacionJoya.findFirst.mockResolvedValue({
      id: 'rep_1',
      empresaId: 'emp_test_id',
      estado: 'LISTA',
      facturaId: 'fac_existing',
    });

    const { POST } = await import('@/app/api/joyeria/reparaciones/[id]/facturar/route');
    const req = new NextRequest('http://localhost/api/joyeria/reparaciones/rep_1/facturar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'rep_1' }) });
    expect(res.status).toBe(409);
  });

  it('falla si no hay costo final ni presupuesto', async () => {
    mockPrisma.reparacionJoya.findFirst.mockResolvedValue({
      id: 'rep_1',
      empresaId: 'emp_test_id',
      estado: 'LISTA',
      facturaId: null,
      costoFinal: null,
      presupuesto: null,
      clienteNombre: 'María González',
      descripcion: 'Reducir talla',
    });

    const { POST } = await import('@/app/api/joyeria/reparaciones/[id]/facturar/route');
    const req = new NextRequest('http://localhost/api/joyeria/reparaciones/rep_1/facturar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'rep_1' }) });
    expect(res.status).toBe(422);
  });

  it('genera factura cuando la reparación está LISTA con costo', async () => {
    mockPrisma.reparacionJoya.findFirst.mockResolvedValue({
      id: 'rep_1',
      empresaId: 'emp_test_id',
      estado: 'LISTA',
      facturaId: null,
      costoFinal: 800,
      presupuesto: 750,
      clienteNombre: 'María González',
      descripcion: 'Reducir talla del anillo',
      clienteId: null,
      piezaId: null,
    });

    const { POST } = await import('@/app/api/joyeria/reparaciones/[id]/facturar/route');
    const req = new NextRequest('http://localhost/api/joyeria/reparaciones/rep_1/facturar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'rep_1' }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
