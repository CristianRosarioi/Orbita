import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TipoCliente, TipoIdentificacion } from '@/types/enums';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}));

vi.mock('@/lib/auth', () => ({
  requireEmpresa: vi.fn().mockResolvedValue('emp_test_id'),
  getOrCreateDbUser: vi.fn().mockResolvedValue({ id: 'usr_test_id' }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cliente: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const bodyValido = {
  tipo: TipoCliente.PERSONA,
  tipoIdentificacion: TipoIdentificacion.CEDULA,
  nombre: 'Juan Pérez',
};

describe('GET /api/clientes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve lista paginada con 200', async () => {
    const { prisma } = await import('@/lib/prisma');
    const mockPrisma = prisma as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
    const mockClientes = [{ id: 'cli_1', nombre: 'Juan Pérez' }];
    mockPrisma.cliente.findMany.mockResolvedValue(mockClientes);
    mockPrisma.cliente.count.mockResolvedValue(1);

    const { GET } = await import('@/app/api/clientes/route');
    const req = new NextRequest('http://localhost/api/clientes');
    const res = await GET(req as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.total).toBe(1);
  });
});

describe('POST /api/clientes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza body vacío con 400', async () => {
    const { POST } = await import('@/app/api/clientes/route');
    const req = new Request('http://localhost/api/clientes', {
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
    const { POST } = await import('@/app/api/clientes/route');
    const req = new Request('http://localhost/api/clientes', {
      method: 'POST',
      body: JSON.stringify({ ...bodyValido, nombre: 'X' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza cédula inválida con 422', async () => {
    const { POST } = await import('@/app/api/clientes/route');
    const req = new Request('http://localhost/api/clientes', {
      method: 'POST',
      body: JSON.stringify({
        ...bodyValido,
        tipoIdentificacion: TipoIdentificacion.CEDULA,
        identificacion: '123',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
  });

  it('crea cliente con datos válidos y devuelve 201', async () => {
    const { prisma } = await import('@/lib/prisma');
    const mockPrisma = prisma as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
    const mockCliente = { id: 'cli_1', ...bodyValido, empresaId: 'emp_test_id' };
    mockPrisma.cliente.create.mockResolvedValue(mockCliente);

    const { POST } = await import('@/app/api/clientes/route');
    const req = new Request('http://localhost/api/clientes', {
      method: 'POST',
      body: JSON.stringify(bodyValido),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('cli_1');
  });

  it('no acepta tipo inválido con 422', async () => {
    const { POST } = await import('@/app/api/clientes/route');
    const req = new Request('http://localhost/api/clientes', {
      method: 'POST',
      body: JSON.stringify({ ...bodyValido, tipo: 'CORPORATIVO' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
  });
});
