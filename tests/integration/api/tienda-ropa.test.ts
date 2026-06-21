import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_1' }),
}));

const mockSesion = {
  usuarioId: 'usr_1',
  empresaActivaId: 'emp_1',
  empresaActiva: { id: 'emp_1', nombre: 'La Moda RD', industria: 'TIENDA_ROPA' },
  sucursalActiva: null,
};

const mockVariante = {
  id: 'var_1',
  empresaId: 'emp_1',
  productoId: 'prod_1',
  talla: 'M',
  color: 'Azul',
  sku: 'CAM-AZ-M',
  stock: 10,
  precio: 1500,
  activa: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDevolucion = {
  id: 'dev_1',
  empresaId: 'emp_1',
  facturaId: 'fac_1',
  clienteId: null,
  motivo: 'Talla incorrecta',
  tipo: 'DEVOLUCION',
  estado: 'PENDIENTE',
  montoCredito: null,
  notas: null,
  creadoPor: 'clerk_1',
  createdAt: new Date(),
  updatedAt: new Date(),
  factura: { id: 'fac_1', numero: 'FAC-0001' },
  cliente: null,
};

const mockFactura = {
  id: 'fac_1',
  empresaId: 'emp_1',
  numero: 'FAC-0001',
  estado: 'PAGADA',
  total: 3000,
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    producto: { findFirst: vi.fn() },
    variante: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    factura: { findFirst: vi.fn() },
    cliente: { findFirst: vi.fn() },
    devolucion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  getCurrentEmpresa: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getCurrentEmpresa } from '@/lib/auth';

function makeReq(url: string, method = 'GET', body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe('GET /api/tienda-ropa/variantes', () => {
  beforeEach(() => {
    vi.mocked(getCurrentEmpresa).mockResolvedValue(mockSesion as never);
  });

  it('requiere productoId', async () => {
    const { GET } = await import('@/app/api/tienda-ropa/variantes/route');
    const res = await GET(makeReq('http://localhost/api/tienda-ropa/variantes'));
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('retorna 404 si el producto no existe', async () => {
    vi.mocked(prisma.producto.findFirst).mockResolvedValue(null);
    const { GET } = await import('@/app/api/tienda-ropa/variantes/route');
    const res = await GET(makeReq('http://localhost/api/tienda-ropa/variantes?productoId=prod_1'));
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(404);
  });

  it('retorna variantes cuando el producto existe', async () => {
    vi.mocked(prisma.producto.findFirst).mockResolvedValue({ id: 'prod_1' } as never);
    vi.mocked(prisma.variante.findMany).mockResolvedValue([mockVariante] as never);
    const { GET } = await import('@/app/api/tienda-ropa/variantes/route');
    const res = await GET(makeReq('http://localhost/api/tienda-ropa/variantes?productoId=prod_1'));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });

  it('retorna 403 para industria incorrecta', async () => {
    vi.mocked(getCurrentEmpresa).mockResolvedValue({
      ...mockSesion,
      empresaActiva: { ...mockSesion.empresaActiva, industria: 'COLMADO' },
    } as never);
    const { GET } = await import('@/app/api/tienda-ropa/variantes/route');
    const res = await GET(makeReq('http://localhost/api/tienda-ropa/variantes?productoId=prod_1'));
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/tienda-ropa/variantes', () => {
  beforeEach(() => {
    vi.mocked(getCurrentEmpresa).mockResolvedValue(mockSesion as never);
    vi.mocked(prisma.producto.findFirst).mockResolvedValue({ id: 'prod_1' } as never);
    vi.mocked(prisma.variante.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.variante.create).mockResolvedValue(mockVariante as never);
  });

  it('crea variante con datos válidos', async () => {
    const { POST } = await import('@/app/api/tienda-ropa/variantes/route');
    const res = await POST(
      makeReq('http://localhost/api/tienda-ropa/variantes', 'POST', {
        productoId: 'clproducto0000000000000001',
        talla: 'M',
        color: 'Azul',
        stock: 10,
      }),
    );
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(res.status).toBe(201);
  });

  it('retorna 422 con datos inválidos', async () => {
    const { POST } = await import('@/app/api/tienda-ropa/variantes/route');
    const res = await POST(
      makeReq('http://localhost/api/tienda-ropa/variantes', 'POST', { productoId: 'invalid' }),
    );
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(422);
  });

  it('retorna 409 si variante duplicada', async () => {
    vi.mocked(prisma.variante.findFirst).mockResolvedValue(mockVariante as never);
    const { POST } = await import('@/app/api/tienda-ropa/variantes/route');
    const res = await POST(
      makeReq('http://localhost/api/tienda-ropa/variantes', 'POST', {
        productoId: 'clproducto0000000000000001',
        talla: 'M',
        color: 'Azul',
      }),
    );
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(409);
  });
});

describe('GET /api/tienda-ropa/devoluciones', () => {
  beforeEach(() => {
    vi.mocked(getCurrentEmpresa).mockResolvedValue(mockSesion as never);
    vi.mocked(prisma.devolucion.count).mockResolvedValue(1);
    vi.mocked(prisma.devolucion.findMany).mockResolvedValue([mockDevolucion] as never);
  });

  it('retorna lista de devoluciones', async () => {
    const { GET } = await import('@/app/api/tienda-ropa/devoluciones/route');
    const res = await GET(makeReq('http://localhost/api/tienda-ropa/devoluciones'));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.data).toHaveLength(1);
  });
});

describe('POST /api/tienda-ropa/devoluciones', () => {
  beforeEach(() => {
    vi.mocked(getCurrentEmpresa).mockResolvedValue(mockSesion as never);
    vi.mocked(prisma.factura.findFirst).mockResolvedValue(mockFactura as never);
    vi.mocked(prisma.devolucion.create).mockResolvedValue(mockDevolucion as never);
  });

  it('crea devolución con datos válidos', async () => {
    const { POST } = await import('@/app/api/tienda-ropa/devoluciones/route');
    const res = await POST(
      makeReq('http://localhost/api/tienda-ropa/devoluciones', 'POST', {
        facturaId: 'clfactura000000000000000001',
        motivo: 'Talla incorrecta',
      }),
    );
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(res.status).toBe(201);
  });

  it('retorna 404 si factura no existe', async () => {
    vi.mocked(prisma.factura.findFirst).mockResolvedValue(null);
    const { POST } = await import('@/app/api/tienda-ropa/devoluciones/route');
    const res = await POST(
      makeReq('http://localhost/api/tienda-ropa/devoluciones', 'POST', {
        facturaId: 'clfactura000000000000000001',
        motivo: 'Producto dañado',
      }),
    );
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(404);
  });

  it('retorna 409 si factura está anulada', async () => {
    vi.mocked(prisma.factura.findFirst).mockResolvedValue({
      ...mockFactura,
      estado: 'ANULADA',
    } as never);
    const { POST } = await import('@/app/api/tienda-ropa/devoluciones/route');
    const res = await POST(
      makeReq('http://localhost/api/tienda-ropa/devoluciones', 'POST', {
        facturaId: 'clfactura000000000000000001',
        motivo: 'Producto dañado',
      }),
    );
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(409);
  });
});
