import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_owner' }),
}));

const mockEmpresa = {
  id: 'emp_1',
  nombre: 'Farmacia Cruz',
  nombreComercial: null,
  industria: 'FARMACIA',
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
    lote: {
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

const hoy = new Date();
const en60dias = new Date(hoy);
en60dias.setDate(hoy.getDate() + 60);
const ayer = new Date(hoy);
ayer.setDate(hoy.getDate() - 3);

const mockLote = {
  id: 'lote_1',
  empresaId: 'emp_1',
  productoId: 'prod_1',
  numeroLote: 'L2024-001',
  fechaVencimiento: en60dias,
  cantidadInicial: 100,
  cantidadActual: 80,
  precioCompra: null,
  proveedor: null,
  notas: null,
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  producto: { id: 'prod_1', nombre: 'Paracetamol 500mg', sku: 'PARA-500' },
};

// ─── GET /api/farmacia/lotes ─────────────────────────────────────

describe('GET /api/farmacia/lotes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve lista de lotes', async () => {
    setupSession();
    mockPrisma.lote.findMany.mockResolvedValue([mockLote]);

    const { GET } = await import('@/app/api/farmacia/lotes/route');
    const req = new NextRequest('http://localhost/api/farmacia/lotes');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].numeroLote).toBe('L2024-001');
  });

  it('filtra por estado vencido', async () => {
    setupSession();
    mockPrisma.lote.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/farmacia/lotes/route');
    const req = new NextRequest('http://localhost/api/farmacia/lotes?vencimiento=vencido');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    const [call] = mockPrisma.lote.findMany.mock.calls;
    expect(call[0].where.fechaVencimiento).toHaveProperty('lt');
  });

  it('rechaza empresa que no es farmacia', async () => {
    mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue({
      ...mockSesion,
      empresaActiva: { ...mockEmpresa, industria: 'FERRETERIA' },
    });

    const { GET } = await import('@/app/api/farmacia/lotes/route');
    const req = new NextRequest('http://localhost/api/farmacia/lotes');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });
});

// ─── POST /api/farmacia/lotes ────────────────────────────────────

describe('POST /api/farmacia/lotes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea un lote válido', async () => {
    setupSession();
    mockPrisma.producto.findFirst.mockResolvedValue({ id: 'prod_1', nombre: 'Paracetamol' });
    mockPrisma.lote.create.mockResolvedValue({ ...mockLote, id: 'nuevo_1' });

    const { POST } = await import('@/app/api/farmacia/lotes/route');
    const req = new NextRequest('http://localhost/api/farmacia/lotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productoId: 'prod_1',
        numeroLote: 'L2024-002',
        fechaVencimiento: '2026-12-31',
        cantidadInicial: 200,
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(res.status).toBe(201);
  });

  it('rechaza si el producto no existe', async () => {
    setupSession();
    mockPrisma.producto.findFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/farmacia/lotes/route');
    const req = new NextRequest('http://localhost/api/farmacia/lotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productoId: 'no_existe',
        numeroLote: 'L2024-002',
        fechaVencimiento: '2026-12-31',
        cantidadInicial: 100,
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('rechaza datos inválidos (sin fecha vencimiento)', async () => {
    setupSession();

    const { POST } = await import('@/app/api/farmacia/lotes/route');
    const req = new NextRequest('http://localhost/api/farmacia/lotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productoId: 'prod_1',
        numeroLote: 'L2024-002',
        cantidadInicial: 100,
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── GET /api/farmacia/vencimientos ──────────────────────────────

describe('GET /api/farmacia/vencimientos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve lotes próximos a vencer con diasRestantes', async () => {
    setupSession();
    mockPrisma.lote.findMany.mockResolvedValue([{ ...mockLote, fechaVencimiento: en60dias }]);

    const { GET } = await import('@/app/api/farmacia/vencimientos/route');
    const req = new NextRequest('http://localhost/api/farmacia/vencimientos?dias=90');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data[0]).toHaveProperty('diasRestantes');
    expect(data.data[0].diasRestantes).toBeGreaterThan(0);
  });

  it('devuelve lotes ya vencidos con días negativos', async () => {
    setupSession();
    mockPrisma.lote.findMany.mockResolvedValue([{ ...mockLote, fechaVencimiento: ayer }]);

    const { GET } = await import('@/app/api/farmacia/vencimientos/route');
    const req = new NextRequest('http://localhost/api/farmacia/vencimientos?vencidos=true');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data[0].diasRestantes).toBeLessThan(0);
  });

  it('usa 30 días por defecto cuando no se especifica', async () => {
    setupSession();
    mockPrisma.lote.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/farmacia/vencimientos/route');
    const req = new NextRequest('http://localhost/api/farmacia/vencimientos');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    const [call] = mockPrisma.lote.findMany.mock.calls;
    expect(call[0].where.fechaVencimiento).toHaveProperty('gte');
    expect(call[0].where.fechaVencimiento).toHaveProperty('lte');
  });
});
