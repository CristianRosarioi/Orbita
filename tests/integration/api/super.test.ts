import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_owner' }),
}));

const mockEmpresa = {
  id: 'emp_super',
  nombre: 'Super Demo',
  nombreComercial: null,
  industria: 'SUPERMERCADO',
  estadoSusc: 'ACTIVO',
  modoFiscal: 'SIMPLE',
  rnc: null,
  trialFinaliza: null,
};

const mockSesion = {
  usuarioId: 'user_owner',
  empresaActivaId: 'emp_super',
  empresaActiva: mockEmpresa,
  sucursalActiva: null,
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: { findFirst: vi.fn() },
    sesionUsuarioEmpresa: { findUnique: vi.fn() },
    departamento: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    categoriaSuper: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    oferta: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    precioVolumen: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    producto: { findFirst: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

function setupSession() {
  mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
  mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue(mockSesion);
}

const mockDepto = {
  id: 'depto_1',
  empresaId: 'emp_super',
  nombre: 'Lácteos',
  descripcion: null,
  activo: true,
  categorias: [],
};

const mockOferta = {
  id: 'oferta_1',
  empresaId: 'emp_super',
  productoId: 'prod_1',
  categoriaId: null,
  nombre: 'Oferta verano',
  descripcion: null,
  precioOriginal: '100.00',
  precioOferta: '80.00',
  descuento: '20.00',
  fechaInicio: new Date('2030-01-01').toISOString(),
  fechaFin: new Date('2030-01-31').toISOString(),
  activa: true,
  producto: { id: 'prod_1', nombre: 'Yogur Griego', sku: 'YOG-001', codigoBarras: null },
  categoria: null,
};

const mockPrecio = {
  id: 'precio_1',
  empresaId: 'emp_super',
  productoId: 'prod_1',
  cantidadMin: '6',
  precio: '45.00',
  etiqueta: 'Pack',
  activo: true,
  producto: { id: 'prod_1', nombre: 'Yogur Griego', sku: 'YOG-001' },
};

// ─── DEPARTAMENTOS ──────────────────────────────────────────────────────────

describe('GET /api/super/departamentos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('devuelve lista de departamentos', async () => {
    mockPrisma.departamento.findMany.mockResolvedValue([mockDepto]);
    const { GET } = await import('@/app/api/super/departamentos/route');
    const req = new NextRequest('http://localhost/api/super/departamentos');
    const res = await GET(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].nombre).toBe('Lácteos');
  });

  it('devuelve 403 si la industria no es supermercado', async () => {
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue({
      ...mockSesion,
      empresaActiva: { ...mockEmpresa, industria: 'RESTAURANTE' },
    });
    const { GET } = await import('@/app/api/super/departamentos/route');
    const req = new NextRequest('http://localhost/api/super/departamentos');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/super/departamentos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('crea departamento exitosamente', async () => {
    mockPrisma.departamento.findFirst.mockResolvedValue(null);
    mockPrisma.departamento.create.mockResolvedValue(mockDepto);
    const { POST } = await import('@/app/api/super/departamentos/route');
    const req = new NextRequest('http://localhost/api/super/departamentos', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Lácteos' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.nombre).toBe('Lácteos');
  });

  it('rechaza nombre duplicado', async () => {
    mockPrisma.departamento.findFirst.mockResolvedValue(mockDepto);
    const { POST } = await import('@/app/api/super/departamentos/route');
    const req = new NextRequest('http://localhost/api/super/departamentos', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Lácteos' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('rechaza nombre vacío (validación Zod)', async () => {
    const { POST } = await import('@/app/api/super/departamentos/route');
    const req = new NextRequest('http://localhost/api/super/departamentos', {
      method: 'POST',
      body: JSON.stringify({ nombre: '' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ─── OFERTAS ────────────────────────────────────────────────────────────────

describe('GET /api/super/ofertas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('devuelve todas las ofertas', async () => {
    mockPrisma.oferta.findMany.mockResolvedValue([mockOferta]);
    const { GET } = await import('@/app/api/super/ofertas/route');
    const req = new NextRequest('http://localhost/api/super/ofertas?filtro=todas');
    const res = await GET(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
  });

  it('devuelve 403 para industria incorrecta', async () => {
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue({
      ...mockSesion,
      empresaActiva: { ...mockEmpresa, industria: 'SALON' },
    });
    const { GET } = await import('@/app/api/super/ofertas/route');
    const req = new NextRequest('http://localhost/api/super/ofertas');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/super/ofertas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('crea oferta con descuento calculado automáticamente', async () => {
    mockPrisma.producto.findFirst.mockResolvedValue({ id: 'prod_1', empresaId: 'emp_super' });
    mockPrisma.oferta.create.mockResolvedValue(mockOferta);

    const { POST } = await import('@/app/api/super/ofertas/route');
    const req = new NextRequest('http://localhost/api/super/ofertas', {
      method: 'POST',
      body: JSON.stringify({
        productoId: 'prod_1',
        nombre: 'Oferta verano',
        precioOriginal: 100,
        precioOferta: 80,
        fechaInicio: '2030-01-01T00:00:00Z',
        fechaFin: '2030-01-31T00:00:00Z',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(true);

    // Verify descuento was calculated
    const createCall = mockPrisma.oferta.create.mock.calls[0][0];
    expect(Number(createCall.data.descuento)).toBeCloseTo(20, 1);
  });

  it('rechaza si precioOferta >= precioOriginal', async () => {
    const { POST } = await import('@/app/api/super/ofertas/route');
    const req = new NextRequest('http://localhost/api/super/ofertas', {
      method: 'POST',
      body: JSON.stringify({
        productoId: 'prod_1',
        nombre: 'Mala oferta',
        precioOriginal: 100,
        precioOferta: 100,
        fechaInicio: '2030-01-01T00:00:00Z',
        fechaFin: '2030-01-31T00:00:00Z',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rechaza si producto no existe en la empresa', async () => {
    mockPrisma.producto.findFirst.mockResolvedValue(null);
    const { POST } = await import('@/app/api/super/ofertas/route');
    const req = new NextRequest('http://localhost/api/super/ofertas', {
      method: 'POST',
      body: JSON.stringify({
        productoId: 'prod_inexistente',
        nombre: 'Oferta',
        precioOriginal: 100,
        precioOferta: 80,
        fechaInicio: '2030-01-01T00:00:00Z',
        fechaFin: '2030-01-31T00:00:00Z',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});

// ─── PRECIOS POR VOLUMEN ────────────────────────────────────────────────────

describe('GET /api/super/precios-volumen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('devuelve precios activos', async () => {
    mockPrisma.precioVolumen.findMany.mockResolvedValue([mockPrecio]);
    const { GET } = await import('@/app/api/super/precios-volumen/route');
    const req = new NextRequest('http://localhost/api/super/precios-volumen');
    const res = await GET(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].etiqueta).toBe('Pack');
  });

  it('filtra por productoId cuando se provee', async () => {
    mockPrisma.precioVolumen.findMany.mockResolvedValue([mockPrecio]);
    const { GET } = await import('@/app/api/super/precios-volumen/route');
    const req = new NextRequest('http://localhost/api/super/precios-volumen?productoId=prod_1');
    await GET(req);
    const whereArg = mockPrisma.precioVolumen.findMany.mock.calls[0][0].where;
    expect(whereArg.productoId).toBe('prod_1');
  });
});

describe('POST /api/super/precios-volumen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('crea precio por volumen exitosamente', async () => {
    mockPrisma.producto.findFirst.mockResolvedValue({ id: 'prod_1', empresaId: 'emp_super' });
    mockPrisma.precioVolumen.create.mockResolvedValue(mockPrecio);

    const { POST } = await import('@/app/api/super/precios-volumen/route');
    const req = new NextRequest('http://localhost/api/super/precios-volumen', {
      method: 'POST',
      body: JSON.stringify({ productoId: 'prod_1', cantidadMin: 6, precio: 45, etiqueta: 'Pack' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('rechaza cantidadMin cero', async () => {
    const { POST } = await import('@/app/api/super/precios-volumen/route');
    const req = new NextRequest('http://localhost/api/super/precios-volumen', {
      method: 'POST',
      body: JSON.stringify({ productoId: 'prod_1', cantidadMin: 0, precio: 45 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rechaza si producto no pertenece a la empresa', async () => {
    mockPrisma.producto.findFirst.mockResolvedValue(null);
    const { POST } = await import('@/app/api/super/precios-volumen/route');
    const req = new NextRequest('http://localhost/api/super/precios-volumen', {
      method: 'POST',
      body: JSON.stringify({ productoId: 'prod_ajeno', cantidadMin: 6, precio: 45 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/super/precios-volumen/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('desactiva precio (soft delete)', async () => {
    mockPrisma.precioVolumen.findFirst.mockResolvedValue(mockPrecio);
    mockPrisma.precioVolumen.update.mockResolvedValue({ ...mockPrecio, activo: false });

    const { DELETE } = await import('@/app/api/super/precios-volumen/[id]/route');
    const req = new NextRequest('http://localhost/api/super/precios-volumen/precio_1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'precio_1' }) });
    const json = await res.json();
    expect(json.success).toBe(true);

    const updateCall = mockPrisma.precioVolumen.update.mock.calls[0][0];
    expect(updateCall.data.activo).toBe(false);
  });

  it('devuelve 404 si precio no existe', async () => {
    mockPrisma.precioVolumen.findFirst.mockResolvedValue(null);
    const { DELETE } = await import('@/app/api/super/precios-volumen/[id]/route');
    const req = new NextRequest('http://localhost/api/super/precios-volumen/x');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'x' }) });
    expect(res.status).toBe(404);
  });
});
