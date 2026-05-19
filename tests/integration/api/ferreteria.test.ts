import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_owner' }),
}));

const mockEmpresa = {
  id: 'emp_1',
  nombre: 'Ferretería El Constructor',
  nombreComercial: null,
  industria: 'FERRETERIA',
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
    pedidoProveedor: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    proveedor: { findFirst: vi.fn() },
    itemPedidoProveedor: {
      findFirst: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
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

const mockPedido = {
  id: 'pedido_1',
  empresaId: 'emp_1',
  proveedorId: 'prov_1',
  numero: 1,
  estado: 'BORRADOR',
  notas: null,
  total: 0,
  fechaPedido: new Date(),
  fechaEntrega: null,
  creadoPor: 'user_owner',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  proveedor: { id: 'prov_1', nombre: 'Distribuidora El Cemento' },
  _count: { items: 0 },
};

// ─── GET /api/ferreteria/pedidos ─────────────────────────────────

describe('GET /api/ferreteria/pedidos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve lista de pedidos', async () => {
    setupSession();
    mockPrisma.pedidoProveedor.findMany.mockResolvedValue([mockPedido]);

    const { GET } = await import('@/app/api/ferreteria/pedidos/route');
    const req = new NextRequest('http://localhost/api/ferreteria/pedidos');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].numero).toBe(1);
  });

  it('filtra por estado BORRADOR', async () => {
    setupSession();
    mockPrisma.pedidoProveedor.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/ferreteria/pedidos/route');
    const req = new NextRequest('http://localhost/api/ferreteria/pedidos?estado=BORRADOR');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    const [call] = mockPrisma.pedidoProveedor.findMany.mock.calls;
    expect(call[0].where.estado).toBe('BORRADOR');
  });

  it('rechaza empresa que no es ferretería', async () => {
    mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue({
      ...mockSesion,
      empresaActiva: { ...mockEmpresa, industria: 'FARMACIA' },
    });

    const { GET } = await import('@/app/api/ferreteria/pedidos/route');
    const req = new NextRequest('http://localhost/api/ferreteria/pedidos');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });
});

// ─── POST /api/ferreteria/pedidos ────────────────────────────────

describe('POST /api/ferreteria/pedidos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea un pedido válido', async () => {
    setupSession();
    mockPrisma.proveedor.findFirst.mockResolvedValue({ id: 'prov_1', nombre: 'Distribuidora' });
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        pedidoProveedor: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ ...mockPedido, id: 'nuevo_1' }),
        },
      };
      return fn(tx);
    });

    const { POST } = await import('@/app/api/ferreteria/pedidos/route');
    const req = new NextRequest('http://localhost/api/ferreteria/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proveedorId: 'prov_1' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(res.status).toBe(201);
  });

  it('rechaza si el proveedor no existe', async () => {
    setupSession();
    mockPrisma.proveedor.findFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/ferreteria/pedidos/route');
    const req = new NextRequest('http://localhost/api/ferreteria/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proveedorId: 'no_existe' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NOT_FOUND');
  });
});

// ─── PATCH /api/ferreteria/pedidos/[id] ──────────────────────────

describe('PATCH /api/ferreteria/pedidos/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('actualiza estado a ENVIADO', async () => {
    setupSession();
    mockPrisma.pedidoProveedor.findFirst.mockResolvedValue(mockPedido);
    mockPrisma.pedidoProveedor.update.mockResolvedValue({ ...mockPedido, estado: 'ENVIADO' });

    const { PATCH } = await import('@/app/api/ferreteria/pedidos/[id]/route');
    const req = new NextRequest('http://localhost/api/ferreteria/pedidos/pedido_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'ENVIADO' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'pedido_1' }) });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.estado).toBe('ENVIADO');
  });

  it('bloquea modificación de pedido RECIBIDO', async () => {
    setupSession();
    mockPrisma.pedidoProveedor.findFirst.mockResolvedValue({ ...mockPedido, estado: 'RECIBIDO' });

    const { PATCH } = await import('@/app/api/ferreteria/pedidos/[id]/route');
    const req = new NextRequest('http://localhost/api/ferreteria/pedidos/pedido_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'ENVIADO' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'pedido_1' }) });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('bloquea modificación de pedido CANCELADO', async () => {
    setupSession();
    mockPrisma.pedidoProveedor.findFirst.mockResolvedValue({ ...mockPedido, estado: 'CANCELADO' });

    const { PATCH } = await import('@/app/api/ferreteria/pedidos/[id]/route');
    const req = new NextRequest('http://localhost/api/ferreteria/pedidos/pedido_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'CONFIRMADO' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'pedido_1' }) });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── DELETE /api/ferreteria/pedidos/[id] ─────────────────────────

describe('DELETE /api/ferreteria/pedidos/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hace soft delete de pedido BORRADOR', async () => {
    setupSession();
    mockPrisma.pedidoProveedor.findFirst.mockResolvedValue(mockPedido);
    mockPrisma.pedidoProveedor.update.mockResolvedValue({ ...mockPedido, deletedAt: new Date() });

    const { DELETE } = await import('@/app/api/ferreteria/pedidos/[id]/route');
    const req = new NextRequest('http://localhost/api/ferreteria/pedidos/pedido_1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'pedido_1' }) });
    const data = await res.json();

    expect(data.success).toBe(true);
  });

  it('bloquea eliminar pedido ENVIADO', async () => {
    setupSession();
    mockPrisma.pedidoProveedor.findFirst.mockResolvedValue({ ...mockPedido, estado: 'ENVIADO' });

    const { DELETE } = await import('@/app/api/ferreteria/pedidos/[id]/route');
    const req = new NextRequest('http://localhost/api/ferreteria/pedidos/pedido_1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'pedido_1' }) });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
