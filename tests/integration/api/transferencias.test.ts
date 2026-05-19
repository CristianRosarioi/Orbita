import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_owner' }),
}));

const mockEmpresa = {
  id: 'emp_1',
  nombre: 'Órbita Demo',
  nombreComercial: null,
  industria: 'COLMADO',
  estadoSusc: 'ACTIVO',
  modoFiscal: 'SIMPLE',
  rnc: null,
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
    transferenciaInventario: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    producto: { findFirst: vi.fn() },
    sucursal: { findFirst: vi.fn() },
    stockSucursal: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/transferencias', () => ({
  ejecutarTransferencia: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { ejecutarTransferencia } from '@/lib/transferencias';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockEjecutar = ejecutarTransferencia as any;

function setupSession() {
  mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
  mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue(mockSesion);
}

const mockTransferencia = {
  id: 'trans_1',
  empresaId: 'emp_1',
  sucursalOrigenId: 'suc_1',
  sucursalDestinoId: 'suc_2',
  productoId: 'prod_1',
  cantidad: 10,
  notas: null,
  estado: 'COMPLETADA',
  creadoPor: 'clerk_owner',
  createdAt: new Date(),
  updatedAt: new Date(),
  sucursalOrigen: { nombre: 'Principal', codigo: 'SP01' },
  sucursalDestino: { nombre: 'Norte', codigo: 'SN01' },
  producto: { nombre: 'Arroz', sku: null },
};

// ─── GET /api/transferencias ─────────────────────────────────

describe('GET /api/transferencias', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve lista de transferencias', async () => {
    setupSession();
    mockPrisma.transferenciaInventario.findMany.mockResolvedValue([mockTransferencia]);

    const { GET } = await import('@/app/api/transferencias/route');
    const req = new NextRequest('http://localhost/api/transferencias');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].estado).toBe('COMPLETADA');
  });

  it('filtra por sucursalId', async () => {
    setupSession();
    mockPrisma.transferenciaInventario.findMany.mockResolvedValue([mockTransferencia]);

    const { GET } = await import('@/app/api/transferencias/route');
    const req = new NextRequest('http://localhost/api/transferencias?sucursalId=suc_1');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    const [call] = mockPrisma.transferenciaInventario.findMany.mock.calls;
    expect(call[0].where).toHaveProperty('OR');
  });
});

// ─── POST /api/transferencias ────────────────────────────────

describe('POST /api/transferencias', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ejecuta una transferencia válida', async () => {
    setupSession();
    mockPrisma.producto.findFirst.mockResolvedValue({ id: 'prod_1', nombre: 'Arroz' });
    mockEjecutar.mockResolvedValue(mockTransferencia);

    const { POST } = await import('@/app/api/transferencias/route');
    const req = new NextRequest('http://localhost/api/transferencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sucursalOrigenId: 'suc_1',
        sucursalDestinoId: 'suc_2',
        productoId: 'prod_1',
        cantidad: 10,
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(res.status).toBe(201);
  });

  it('rechaza origen y destino iguales', async () => {
    setupSession();

    const { POST } = await import('@/app/api/transferencias/route');
    const req = new NextRequest('http://localhost/api/transferencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sucursalOrigenId: 'suc_1',
        sucursalDestinoId: 'suc_1',
        productoId: 'prod_1',
        cantidad: 10,
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('retorna FORBIDDEN si stock insuficiente', async () => {
    setupSession();
    mockPrisma.producto.findFirst.mockResolvedValue({ id: 'prod_1', nombre: 'Arroz' });
    mockEjecutar.mockRejectedValue(new Error('STOCK_INSUFICIENTE'));

    const { POST } = await import('@/app/api/transferencias/route');
    const req = new NextRequest('http://localhost/api/transferencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sucursalOrigenId: 'suc_1',
        sucursalDestinoId: 'suc_2',
        productoId: 'prod_1',
        cantidad: 9999,
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('retorna NOT_FOUND si el producto no existe', async () => {
    setupSession();
    mockPrisma.producto.findFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/transferencias/route');
    const req = new NextRequest('http://localhost/api/transferencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sucursalOrigenId: 'suc_1',
        sucursalDestinoId: 'suc_2',
        productoId: 'no_existe',
        cantidad: 5,
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NOT_FOUND');
  });
});
