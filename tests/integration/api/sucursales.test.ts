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
    sucursal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

function setupSession() {
  mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
  mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue(mockSesion);
}

const mockSucursal = {
  id: 'suc_1',
  empresaId: 'emp_1',
  nombre: 'Sucursal Principal',
  codigo: 'SP01',
  ciudad: 'Santo Domingo',
  telefono: null,
  encargado: null,
  direccion: null,
  esPrincipal: true,
  activa: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

// ─── GET /api/sucursales ─────────────────────────────────────

describe('GET /api/sucursales', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve lista de sucursales', async () => {
    setupSession();
    mockPrisma.sucursal.findMany.mockResolvedValue([mockSucursal]);

    const { GET } = await import('@/app/api/sucursales/route');
    const req = new NextRequest('http://localhost/api/sucursales');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].codigo).toBe('SP01');
  });

  it('requiere sesión activa', async () => {
    mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue(null);

    const { GET } = await import('@/app/api/sucursales/route');
    const req = new NextRequest('http://localhost/api/sucursales');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});

// ─── POST /api/sucursales ────────────────────────────────────

describe('POST /api/sucursales', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea una sucursal válida', async () => {
    setupSession();
    mockPrisma.sucursal.findFirst.mockResolvedValue(null);
    mockPrisma.sucursal.create.mockResolvedValue({ ...mockSucursal, id: 'suc_nueva' });

    const { POST } = await import('@/app/api/sucursales/route');
    const req = new NextRequest('http://localhost/api/sucursales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Sucursal Norte', codigo: 'SN01' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(res.status).toBe(201);
  });

  it('rechaza código duplicado', async () => {
    setupSession();
    mockPrisma.sucursal.findFirst.mockResolvedValue(mockSucursal);

    const { POST } = await import('@/app/api/sucursales/route');
    const req = new NextRequest('http://localhost/api/sucursales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Otra', codigo: 'SP01' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza datos inválidos (sin nombre)', async () => {
    setupSession();

    const { POST } = await import('@/app/api/sucursales/route');
    const req = new NextRequest('http://localhost/api/sucursales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: 'SN02' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── DELETE /api/sucursales/[id] ─────────────────────────────

describe('DELETE /api/sucursales/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('desactiva una sucursal no principal', async () => {
    setupSession();
    mockPrisma.sucursal.findFirst.mockResolvedValue({ ...mockSucursal, esPrincipal: false });
    mockPrisma.sucursal.update.mockResolvedValue({ ...mockSucursal, activa: false });

    const { DELETE } = await import('@/app/api/sucursales/[id]/route');
    const req = new NextRequest('http://localhost/api/sucursales/suc_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'suc_1' }) });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(mockPrisma.sucursal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ activa: false }) }),
    );
  });

  it('no permite eliminar la sucursal principal', async () => {
    setupSession();
    mockPrisma.sucursal.findFirst.mockResolvedValue(mockSucursal);

    const { DELETE } = await import('@/app/api/sucursales/[id]/route');
    const req = new NextRequest('http://localhost/api/sucursales/suc_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'suc_1' }) });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });
});
