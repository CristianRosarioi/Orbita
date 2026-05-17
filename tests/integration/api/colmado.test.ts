import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_1' }),
}));

const mockEmpresa = {
  id: 'emp_1',
  nombre: 'Colmado El Buen Precio',
  industria: 'COLMADO',
};

const mockCliente = {
  id: 'cli_1',
  nombre: 'Juan Pérez',
  telefono: '809-555-1234',
  email: null,
  deletedAt: null,
};

const mockCuentaFiado = {
  id: 'fiado_1',
  empresaId: 'emp_1',
  clienteId: 'cli_1',
  estado: 'PENDIENTE',
  limite: 5000,
  saldo: 1200,
  notas: null,
  cliente: mockCliente,
  movimientos: [],
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: { findFirst: vi.fn() },
    sesionUsuarioEmpresa: { findUnique: vi.fn() },
    miembroEmpresa: { findFirst: vi.fn() },
    empresa: { findFirst: vi.fn() },
    cliente: { findFirst: vi.fn(), create: vi.fn() },
    cuentaFiado: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    movimientoFiado: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

function setupSession(industria = 'COLMADO') {
  mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_1', clerkId: 'clerk_1', deletedAt: null });
  mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue({
    usuarioId: 'user_1',
    empresaActivaId: 'emp_1',
    empresaActiva: { ...mockEmpresa, industria },
    sucursalActiva: null,
  });
  mockPrisma.miembroEmpresa.findFirst.mockResolvedValue({
    id: 'memb_1',
    usuarioId: 'user_1',
    empresaId: 'emp_1',
    rol: 'OWNER',
    activo: true,
    empresa: { ...mockEmpresa, industria },
  });
}

describe('GET /api/colmado/fiado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('retorna lista de cuentas de fiado', async () => {
    mockPrisma.cuentaFiado.findMany.mockResolvedValue([mockCuentaFiado]);

    const { GET } = await import('@/app/api/colmado/fiado/route');
    const req = new NextRequest('http://localhost/api/colmado/fiado');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0].saldo).toBe(1200);
  });

  it('retorna 403 para industria RESTAURANTE', async () => {
    setupSession('RESTAURANTE');

    const { GET } = await import('@/app/api/colmado/fiado/route');
    const req = new NextRequest('http://localhost/api/colmado/fiado');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
  });
});

describe('GET /api/colmado/fiado/resumen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('retorna métricas de fiado', async () => {
    mockPrisma.cuentaFiado.aggregate.mockResolvedValue({ _sum: { saldoActual: 5000 }, _count: { id: 3 } });
    mockPrisma.cuentaFiado.count.mockResolvedValue(2);
    mockPrisma.cuentaFiado.findMany.mockResolvedValue([
      { ...mockCuentaFiado, saldoActual: 3000, cliente: { nombre: 'Top Deudor' } },
    ]);

    const { GET } = await import('@/app/api/colmado/fiado/resumen/route');
    const req = new Request('http://localhost/api/colmado/fiado/resumen');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('totalPendiente');
    expect(body.data).toHaveProperty('cuentasActivas');
    expect(body.data).toHaveProperty('topDeudores');
  });
});

describe('POST /api/colmado/fiado/[id]/abono', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('registra abono correctamente', async () => {
    mockPrisma.cuentaFiado.findFirst.mockResolvedValue(mockCuentaFiado);
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => {
      return cb(mockPrisma);
    });
    mockPrisma.movimientoFiado.create.mockResolvedValue({
      id: 'mov_1',
      tipo: 'ABONO',
      monto: 500,
      saldoNuevo: 700,
    });
    mockPrisma.cuentaFiado.update.mockResolvedValue({
      ...mockCuentaFiado,
      saldo: 700,
    });

    const { POST } = await import('@/app/api/colmado/fiado/[id]/abono/route');
    const req = new Request('http://localhost/api/colmado/fiado/fiado_1/abono', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: 500 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'fiado_1' }) });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('retorna 422 si monto es cero', async () => {
    const { POST } = await import('@/app/api/colmado/fiado/[id]/abono/route');
    const req = new Request('http://localhost/api/colmado/fiado/fiado_1/abono', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: 0 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'fiado_1' }) });
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
  });
});

describe('POST /api/colmado/fiado/[id]/cargo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('retorna 422 si supera el límite de crédito', async () => {
    mockPrisma.cuentaFiado.findFirst.mockResolvedValue({
      ...mockCuentaFiado,
      limite: 1500,
      saldo: 1200,
    });

    const { POST } = await import('@/app/api/colmado/fiado/[id]/cargo/route');
    const req = new Request('http://localhost/api/colmado/fiado/fiado_1/cargo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: 400 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'fiado_1' }) });
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
  });
});
