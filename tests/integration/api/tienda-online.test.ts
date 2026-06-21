import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_1' }),
}));

const mockSesion = {
  usuarioId: 'usr_1',
  empresaActivaId: 'emp_1',
  empresaActiva: { id: 'emp_1', nombre: 'Shop Online RD', industria: 'TIENDA_ONLINE' },
  sucursalActiva: null,
};

const mockItem = {
  id: 'item_1',
  pedidoId: 'ped_1',
  productoId: null,
  descripcion: 'Camisa azul M',
  cantidad: 2,
  precioUnitario: 1200,
  subtotal: 2400,
  createdAt: new Date(),
  producto: null,
};

const mockPedido = {
  id: 'ped_1',
  empresaId: 'emp_1',
  numero: 1,
  clienteId: null,
  clienteNombre: 'Juan Pérez',
  clienteTelefono: '829-555-0001',
  canal: 'WHATSAPP',
  estado: 'PENDIENTE',
  subtotal: 2400,
  itbis: 432,
  total: 2832,
  metodoPago: null,
  tracking: null,
  direccionEntrega: null,
  notas: null,
  facturaId: null,
  creadoPor: 'clerk_1',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [mockItem],
  cliente: null,
  _count: { items: 1 },
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cliente: { findFirst: vi.fn() },
    pedidoOnline: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    factura: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  getCurrentEmpresa: vi.fn(),
}));

vi.mock('@/lib/facturacion', () => ({
  generarNumeroFactura: vi.fn().mockResolvedValue({
    numero: 'FAC-0001',
    numeroInt: 1,
    anio: 2026,
  }),
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

describe('GET /api/tienda-online/pedidos', () => {
  beforeEach(() => {
    vi.mocked(getCurrentEmpresa).mockResolvedValue(mockSesion as never);
    vi.mocked(prisma.pedidoOnline.count).mockResolvedValue(1);
    vi.mocked(prisma.pedidoOnline.findMany).mockResolvedValue([mockPedido] as never);
  });

  it('retorna lista de pedidos', async () => {
    const { GET } = await import('@/app/api/tienda-online/pedidos/route');
    const res = await GET(makeReq('http://localhost/api/tienda-online/pedidos'));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.data).toHaveLength(1);
    expect(data.data.meta.total).toBe(1);
  });

  it('retorna 403 para industria incorrecta', async () => {
    vi.mocked(getCurrentEmpresa).mockResolvedValue({
      ...mockSesion,
      empresaActiva: { ...mockSesion.empresaActiva, industria: 'COLMADO' },
    } as never);
    const { GET } = await import('@/app/api/tienda-online/pedidos/route');
    const res = await GET(makeReq('http://localhost/api/tienda-online/pedidos'));
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/tienda-online/pedidos', () => {
  beforeEach(() => {
    vi.mocked(getCurrentEmpresa).mockResolvedValue(mockSesion as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        pedidoOnline: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(mockPedido),
        },
      };
      return fn(tx as never);
    });
  });

  it('crea pedido con datos válidos', async () => {
    const { POST } = await import('@/app/api/tienda-online/pedidos/route');
    const res = await POST(
      makeReq('http://localhost/api/tienda-online/pedidos', 'POST', {
        clienteNombre: 'Juan Pérez',
        canal: 'WHATSAPP',
        items: [{ descripcion: 'Camisa azul M', cantidad: 2, precioUnitario: 1200 }],
      }),
    );
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(res.status).toBe(201);
  });

  it('rechaza pedido sin ítems', async () => {
    const { POST } = await import('@/app/api/tienda-online/pedidos/route');
    const res = await POST(
      makeReq('http://localhost/api/tienda-online/pedidos', 'POST', {
        clienteNombre: 'Juan Pérez',
        items: [],
      }),
    );
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(422);
  });

  it('rechaza pedido sin clienteNombre', async () => {
    const { POST } = await import('@/app/api/tienda-online/pedidos/route');
    const res = await POST(
      makeReq('http://localhost/api/tienda-online/pedidos', 'POST', {
        items: [{ descripcion: 'Camisa', cantidad: 1, precioUnitario: 500 }],
      }),
    );
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(422);
  });
});

describe('GET /api/tienda-online/pedidos/[id]', () => {
  beforeEach(() => {
    vi.mocked(getCurrentEmpresa).mockResolvedValue(mockSesion as never);
  });

  it('retorna pedido existente', async () => {
    vi.mocked(prisma.pedidoOnline.findFirst).mockResolvedValue(mockPedido as never);
    const { GET } = await import('@/app/api/tienda-online/pedidos/[id]/route');
    const res = await GET(makeReq('http://localhost/api/tienda-online/pedidos/ped_1'), {
      params: Promise.resolve({ id: 'ped_1' }),
    });
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('ped_1');
  });

  it('retorna 404 si no existe', async () => {
    vi.mocked(prisma.pedidoOnline.findFirst).mockResolvedValue(null);
    const { GET } = await import('@/app/api/tienda-online/pedidos/[id]/route');
    const res = await GET(makeReq('http://localhost/api/tienda-online/pedidos/no_existe'), {
      params: Promise.resolve({ id: 'no_existe' }),
    });
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/tienda-online/pedidos/[id]', () => {
  beforeEach(() => {
    vi.mocked(getCurrentEmpresa).mockResolvedValue(mockSesion as never);
  });

  it('actualiza estado correctamente', async () => {
    vi.mocked(prisma.pedidoOnline.findFirst).mockResolvedValue(mockPedido as never);
    vi.mocked(prisma.pedidoOnline.update).mockResolvedValue({
      ...mockPedido,
      estado: 'CONFIRMADO',
    } as never);
    const { PATCH } = await import('@/app/api/tienda-online/pedidos/[id]/route');
    const res = await PATCH(
      makeReq('http://localhost/api/tienda-online/pedidos/ped_1', 'PATCH', {
        estado: 'CONFIRMADO',
      }),
      { params: Promise.resolve({ id: 'ped_1' }) },
    );
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('bloquea modificación de pedido ENTREGADO', async () => {
    vi.mocked(prisma.pedidoOnline.findFirst).mockResolvedValue({
      ...mockPedido,
      estado: 'ENTREGADO',
    } as never);
    const { PATCH } = await import('@/app/api/tienda-online/pedidos/[id]/route');
    const res = await PATCH(
      makeReq('http://localhost/api/tienda-online/pedidos/ped_1', 'PATCH', {
        estado: 'CANCELADO',
      }),
      { params: Promise.resolve({ id: 'ped_1' }) },
    );
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/tienda-online/pedidos/[id]', () => {
  beforeEach(() => {
    vi.mocked(getCurrentEmpresa).mockResolvedValue(mockSesion as never);
  });

  it('cancela pedido sin factura', async () => {
    vi.mocked(prisma.pedidoOnline.findFirst).mockResolvedValue(mockPedido as never);
    vi.mocked(prisma.pedidoOnline.update).mockResolvedValue({
      ...mockPedido,
      estado: 'CANCELADO',
      deletedAt: new Date(),
    } as never);
    const { DELETE } = await import('@/app/api/tienda-online/pedidos/[id]/route');
    const res = await DELETE(makeReq('http://localhost/api/tienda-online/pedidos/ped_1'), {
      params: Promise.resolve({ id: 'ped_1' }),
    });
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('bloquea cancelación de pedido facturado', async () => {
    vi.mocked(prisma.pedidoOnline.findFirst).mockResolvedValue({
      ...mockPedido,
      facturaId: 'fac_1',
    } as never);
    const { DELETE } = await import('@/app/api/tienda-online/pedidos/[id]/route');
    const res = await DELETE(makeReq('http://localhost/api/tienda-online/pedidos/ped_1'), {
      params: Promise.resolve({ id: 'ped_1' }),
    });
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(res.status).toBe(409);
  });
});
