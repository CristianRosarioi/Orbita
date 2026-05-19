import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_owner' }),
}));

const mockEmpresa = {
  id: 'emp_1',
  nombre: 'Salón Belleza',
  nombreComercial: null,
  industria: 'SALON_BARBERIA',
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
    cita: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

const mockCita = {
  id: 'cita_1',
  empresaId: 'emp_1',
  clienteId: null,
  clienteNombre: 'María García',
  clienteTelefono: '809-555-1234',
  empleadoId: null,
  servicio: 'Corte y tinte',
  fecha: new Date('2026-05-20T10:00:00'),
  duracionMin: 90,
  precio: 1500,
  estado: 'PENDIENTE',
  notas: null,
  facturaId: null,
  creadoPor: 'user_owner',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── GET /api/salon/citas ────────────────────────────────────────

describe('GET /api/salon/citas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve lista de citas', async () => {
    setupSession();
    mockPrisma.cita.findMany.mockResolvedValue([mockCita]);

    const { GET } = await import('@/app/api/salon/citas/route');
    const req = new NextRequest('http://localhost/api/salon/citas');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].clienteNombre).toBe('María García');
  });

  it('filtra por estado', async () => {
    setupSession();
    mockPrisma.cita.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/salon/citas/route');
    const req = new NextRequest('http://localhost/api/salon/citas?estado=CONFIRMADA');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    const [call] = mockPrisma.cita.findMany.mock.calls;
    expect(call[0].where.estado).toBe('CONFIRMADA');
  });

  it('rechaza empresa que no es salón', async () => {
    mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue({
      ...mockSesion,
      empresaActiva: { ...mockEmpresa, industria: 'TALLER_MECANICO' },
    });

    const { GET } = await import('@/app/api/salon/citas/route');
    const req = new NextRequest('http://localhost/api/salon/citas');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('rechaza sin autenticación', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

    const { GET } = await import('@/app/api/salon/citas/route');
    const req = new NextRequest('http://localhost/api/salon/citas');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});

// ─── POST /api/salon/citas ────────────────────────────────────────

describe('POST /api/salon/citas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea una cita válida', async () => {
    setupSession();
    mockPrisma.cita.create.mockResolvedValue({ ...mockCita, id: 'nueva_1' });

    const { POST } = await import('@/app/api/salon/citas/route');
    const req = new NextRequest('http://localhost/api/salon/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteNombre: 'María García',
        servicio: 'Corte y tinte',
        fecha: '2026-05-20T10:00',
        precio: 1500,
        duracionMin: 90,
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(res.status).toBe(201);
  });

  it('rechaza cita sin nombre de cliente', async () => {
    setupSession();

    const { POST } = await import('@/app/api/salon/citas/route');
    const req = new NextRequest('http://localhost/api/salon/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        servicio: 'Corte y tinte',
        fecha: '2026-05-20T10:00',
        precio: 1500,
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza cita con precio cero', async () => {
    setupSession();

    const { POST } = await import('@/app/api/salon/citas/route');
    const req = new NextRequest('http://localhost/api/salon/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteNombre: 'Ana López',
        servicio: 'Manicure',
        fecha: '2026-05-20T14:00',
        precio: 0,
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── GET /api/salon/citas/[id] ───────────────────────────────────

describe('GET /api/salon/citas/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve detalle de la cita', async () => {
    setupSession();
    mockPrisma.cita.findFirst.mockResolvedValue({ ...mockCita, cliente: null });

    const { GET } = await import('@/app/api/salon/citas/[id]/route');
    const req = new NextRequest('http://localhost/api/salon/citas/cita_1');
    const res = await GET(req, { params: Promise.resolve({ id: 'cita_1' }) });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.id).toBe('cita_1');
  });

  it('devuelve 404 para cita inexistente', async () => {
    setupSession();
    mockPrisma.cita.findFirst.mockResolvedValue(null);

    const { GET } = await import('@/app/api/salon/citas/[id]/route');
    const req = new NextRequest('http://localhost/api/salon/citas/no_existe');
    const res = await GET(req, { params: Promise.resolve({ id: 'no_existe' }) });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NOT_FOUND');
  });
});

// ─── PATCH /api/salon/citas/[id] ─────────────────────────────────

describe('PATCH /api/salon/citas/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('actualiza estado a CONFIRMADA', async () => {
    setupSession();
    mockPrisma.cita.findFirst.mockResolvedValue(mockCita);
    mockPrisma.cita.update.mockResolvedValue({ ...mockCita, estado: 'CONFIRMADA' });

    const { PATCH } = await import('@/app/api/salon/citas/[id]/route');
    const req = new NextRequest('http://localhost/api/salon/citas/cita_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'CONFIRMADA' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'cita_1' }) });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.estado).toBe('CONFIRMADA');
  });

  it('bloquea modificación de cita COMPLETADA', async () => {
    setupSession();
    mockPrisma.cita.findFirst.mockResolvedValue({ ...mockCita, estado: 'COMPLETADA' });

    const { PATCH } = await import('@/app/api/salon/citas/[id]/route');
    const req = new NextRequest('http://localhost/api/salon/citas/cita_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'EN_PROCESO' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'cita_1' }) });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('bloquea modificación de cita CANCELADA', async () => {
    setupSession();
    mockPrisma.cita.findFirst.mockResolvedValue({ ...mockCita, estado: 'CANCELADA' });

    const { PATCH } = await import('@/app/api/salon/citas/[id]/route');
    const req = new NextRequest('http://localhost/api/salon/citas/cita_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'CONFIRMADA' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'cita_1' }) });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza estado inválido', async () => {
    setupSession();
    mockPrisma.cita.findFirst.mockResolvedValue(mockCita);

    const { PATCH } = await import('@/app/api/salon/citas/[id]/route');
    const req = new NextRequest('http://localhost/api/salon/citas/cita_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'ATENDIDA' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'cita_1' }) });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
