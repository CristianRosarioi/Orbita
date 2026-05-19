import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_owner' }),
}));

const mockEmpresa = {
  id: 'emp_1',
  nombre: 'Taller Pérez',
  nombreComercial: null,
  industria: 'TALLER_MECANICO',
  estadoSusc: 'ACTIVO',
  modoFiscal: 'SIMPLE',
  rnc: '101234567',
  trialFinaliza: null,
};

const mockSesion = {
  usuarioId: 'user_owner',
  empresaActivaId: 'emp_1',
  empresaActiva: mockEmpresa,
  sucursalActiva: null,
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: { findFirst: vi.fn() },
    sesionUsuarioEmpresa: { findUnique: vi.fn() },
    ordenTrabajo: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    itemOrdenTrabajo: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    factura: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

function setupSession() {
  mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
  mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue(mockSesion);
}

const mockOrden = {
  id: 'orden_1',
  empresaId: 'emp_1',
  numero: 1,
  clienteNombre: 'Pedro Martínez',
  clienteTelefono: '809-555-0001',
  vehiculoMarca: 'Toyota',
  vehiculoModelo: 'Corolla',
  vehiculoAnio: 2020,
  vehiculoPlaca: 'A123456',
  vehiculoColor: 'Blanco',
  kilometraje: 50000,
  descripcionFalla: 'Motor hace ruido al arrancar',
  estado: 'RECIBIDO',
  subtotal: 1000,
  itbis: 180,
  total: 1180,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  facturaId: null,
};

// ─── GET /api/taller/ordenes ────────────────────────────────────

describe('GET /api/taller/ordenes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve lista de órdenes', async () => {
    setupSession();
    mockPrisma.ordenTrabajo.findMany.mockResolvedValue([mockOrden]);

    const { GET } = await import('@/app/api/taller/ordenes/route');
    const req = new NextRequest('http://localhost/api/taller/ordenes');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].numero).toBe(1);
  });

  it('filtra por estado', async () => {
    setupSession();
    mockPrisma.ordenTrabajo.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/taller/ordenes/route');
    const req = new NextRequest('http://localhost/api/taller/ordenes?estado=LISTO');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    const [call] = mockPrisma.ordenTrabajo.findMany.mock.calls;
    expect(call[0].where.estado).toBe('LISTO');
  });

  it('rechaza sin sesión activa', async () => {
    mockPrisma.usuario.findFirst.mockResolvedValue(null);
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue(null);

    const { GET } = await import('@/app/api/taller/ordenes/route');
    const req = new NextRequest('http://localhost/api/taller/ordenes');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('rechaza empresa de industria incorrecta', async () => {
    mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue({
      ...mockSesion,
      empresaActiva: { ...mockEmpresa, industria: 'RETAIL' },
    });

    const { GET } = await import('@/app/api/taller/ordenes/route');
    const req = new NextRequest('http://localhost/api/taller/ordenes');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });
});

// ─── POST /api/taller/ordenes ────────────────────────────────────

describe('POST /api/taller/ordenes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea una orden válida', async () => {
    setupSession();
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        ordenTrabajo: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ ...mockOrden, id: 'nueva_1' }),
        },
      };
      return fn(tx);
    });

    const { POST } = await import('@/app/api/taller/ordenes/route');
    const req = new NextRequest('http://localhost/api/taller/ordenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteNombre: 'Pedro Martínez',
        vehiculoMarca: 'Toyota',
        vehiculoModelo: 'Corolla',
        vehiculoPlaca: 'a123456',
        descripcionFalla: 'Motor hace ruido',
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(res.status).toBe(201);
  });

  it('rechaza datos incompletos (sin marca)', async () => {
    setupSession();

    const { POST } = await import('@/app/api/taller/ordenes/route');
    const req = new NextRequest('http://localhost/api/taller/ordenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteNombre: 'Pedro Martínez',
        vehiculoModelo: 'Corolla',
        vehiculoPlaca: 'A123456',
        descripcionFalla: 'Motor hace ruido',
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── GET /api/taller/ordenes/[id] ────────────────────────────────

describe('GET /api/taller/ordenes/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve detalle de la orden', async () => {
    setupSession();
    mockPrisma.ordenTrabajo.findFirst.mockResolvedValue({ ...mockOrden, items: [] });

    const { GET } = await import('@/app/api/taller/ordenes/[id]/route');
    const req = new NextRequest('http://localhost/api/taller/ordenes/orden_1');
    const res = await GET(req, { params: Promise.resolve({ id: 'orden_1' }) });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.id).toBe('orden_1');
  });

  it('devuelve 404 para orden inexistente', async () => {
    setupSession();
    mockPrisma.ordenTrabajo.findFirst.mockResolvedValue(null);

    const { GET } = await import('@/app/api/taller/ordenes/[id]/route');
    const req = new NextRequest('http://localhost/api/taller/ordenes/no_existe');
    const res = await GET(req, { params: Promise.resolve({ id: 'no_existe' }) });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NOT_FOUND');
  });
});

// ─── PATCH /api/taller/ordenes/[id] ──────────────────────────────

describe('PATCH /api/taller/ordenes/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('actualiza estado correctamente', async () => {
    setupSession();
    mockPrisma.ordenTrabajo.findFirst.mockResolvedValue(mockOrden);
    mockPrisma.ordenTrabajo.update.mockResolvedValue({ ...mockOrden, estado: 'EN_DIAGNOSTICO' });

    const { PATCH } = await import('@/app/api/taller/ordenes/[id]/route');
    const req = new NextRequest('http://localhost/api/taller/ordenes/orden_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'EN_DIAGNOSTICO' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'orden_1' }) });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.estado).toBe('EN_DIAGNOSTICO');
  });

  it('bloquea modificación de orden ENTREGADA', async () => {
    setupSession();
    mockPrisma.ordenTrabajo.findFirst.mockResolvedValue({ ...mockOrden, estado: 'ENTREGADO' });

    const { PATCH } = await import('@/app/api/taller/ordenes/[id]/route');
    const req = new NextRequest('http://localhost/api/taller/ordenes/orden_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'EN_REPARACION' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'orden_1' }) });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── POST /api/taller/ordenes/[id]/items ─────────────────────────

describe('POST /api/taller/ordenes/[id]/items', () => {
  beforeEach(() => vi.clearAllMocks());

  it('agrega ítem de servicio correctamente', async () => {
    setupSession();
    mockPrisma.ordenTrabajo.findFirst.mockResolvedValue(mockOrden);
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        itemOrdenTrabajo: {
          create: vi.fn().mockResolvedValue({
            id: 'item_1',
            tipo: 'SERVICIO',
            descripcion: 'Cambio de aceite',
            cantidad: 1,
            precioUnitario: 500,
            subtotal: 500,
            itbisMonto: 90,
            total: 590,
          }),
          findMany: vi.fn().mockResolvedValue([]),
        },
        ordenTrabajo: {
          update: vi.fn().mockResolvedValue(mockOrden),
        },
      };
      return fn(tx);
    });

    const { POST } = await import('@/app/api/taller/ordenes/[id]/items/route');
    const req = new NextRequest('http://localhost/api/taller/ordenes/orden_1/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'SERVICIO',
        descripcion: 'Cambio de aceite',
        cantidad: 1,
        precioUnitario: 500,
        itbisPorcentaje: 18,
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'orden_1' }) });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(res.status).toBe(201);
  });
});
