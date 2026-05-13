import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TipoProducto } from '@/types/enums';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}));

vi.mock('@/lib/auth', () => ({
  requireEmpresa: vi.fn().mockResolvedValue('emp_test_id'),
  getOrCreateDbUser: vi.fn().mockResolvedValue({ id: 'usr_test_id' }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    producto: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    precioProducto: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const bodyValido = {
  tipo: TipoProducto.BIEN,
  nombre: 'Agua Mineral 500ml',
  unidadMedidaId: 'cm9abc123def456ghi789jkl01',
  precioVenta: 35,
  itbisAplicable: true,
  itbisIncluidoEnPrecio: false,
};

describe('GET /api/productos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve lista paginada con 200', async () => {
    const { prisma } = await import('@/lib/prisma');
    const mockPrisma = prisma as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
    const mockProductos = [{ id: 'prod_1', nombre: 'Agua Mineral 500ml' }];
    mockPrisma.producto.findMany.mockResolvedValue(mockProductos);
    mockPrisma.producto.count.mockResolvedValue(1);

    const { GET } = await import('@/app/api/productos/route');
    const req = new NextRequest('http://localhost/api/productos');
    const res = await GET(req as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.total).toBe(1);
  });
});

describe('POST /api/productos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza body vacío con 400', async () => {
    const { POST } = await import('@/app/api/productos/route');
    const req = new Request('http://localhost/api/productos', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('rechaza nombre corto con 422', async () => {
    const { POST } = await import('@/app/api/productos/route');
    const req = new Request('http://localhost/api/productos', {
      method: 'POST',
      body: JSON.stringify({ ...bodyValido, nombre: 'A' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza servicio con stock mayor a cero con 422', async () => {
    const { POST } = await import('@/app/api/productos/route');
    const req = new Request('http://localhost/api/productos', {
      method: 'POST',
      body: JSON.stringify({
        ...bodyValido,
        tipo: TipoProducto.SERVICIO,
        stockActual: 10,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
  });

  it('crea producto con datos válidos y devuelve 201', async () => {
    const { prisma } = await import('@/lib/prisma');
    const mockPrisma = prisma as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
    const mockProducto = { id: 'prod_1', ...bodyValido, empresaId: 'emp_test_id', precios: [] };
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        producto: {
          create: vi.fn().mockResolvedValue({ id: 'prod_1' }),
          findUniqueOrThrow: vi.fn().mockResolvedValue(mockProducto),
        },
        precioProducto: { createMany: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const { POST } = await import('@/app/api/productos/route');
    const req = new Request('http://localhost/api/productos', {
      method: 'POST',
      body: JSON.stringify(bodyValido),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('prod_1');
  });

  it('rechaza precio de venta negativo con 422', async () => {
    const { POST } = await import('@/app/api/productos/route');
    const req = new Request('http://localhost/api/productos', {
      method: 'POST',
      body: JSON.stringify({ ...bodyValido, precioVenta: -5 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
  });
});
