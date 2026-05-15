import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}));

vi.mock('@/lib/auth', () => ({
  requireEmpresa: vi.fn().mockResolvedValue('emp_test_id'),
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'user_test_id' }),
}));

const mockSesionActiva = {
  id: 'caja_test_id',
  empresaId: 'emp_test_id',
  usuarioId: 'user_test_id',
  estado: 'ABIERTA',
  montoApertura: 5000,
  fechaApertura: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  sucursalId: null,
  montoCierreDeclarado: null,
  montoCierreReal: null,
  diferencia: null,
  fechaCierre: null,
  notas: null,
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sesionCaja: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    factura: {
      findMany: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({ _sum: { monto: null }, _count: { id: 0 } }),
    },
    pagoFactura: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { monto: null } }),
    },
  },
}));

describe('GET /api/caja/sesion-activa', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna null cuando no hay sesión activa', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.sesionCaja.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { GET } = await import('@/app/api/caja/sesion-activa/route');
    const req = new NextRequest('http://localhost/api/caja/sesion-activa');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it('retorna la sesión activa cuando existe', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.sesionCaja.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockSesionActiva);

    const { GET } = await import('@/app/api/caja/sesion-activa/route');
    const req = new NextRequest('http://localhost/api/caja/sesion-activa');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('caja_test_id');
  });
});

describe('POST /api/caja/abrir', () => {
  beforeEach(() => vi.clearAllMocks());

  it('abre caja con monto válido', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.sesionCaja.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null); // no hay abierta
    (prisma.sesionCaja.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockSesionActiva);

    const { POST } = await import('@/app/api/caja/abrir/route');
    const req = new NextRequest('http://localhost/api/caja/abrir', {
      method: 'POST',
      body: JSON.stringify({ montoApertura: 5000 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('rechaza cuando ya hay una caja abierta', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.sesionCaja.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockSesionActiva);

    const { POST } = await import('@/app/api/caja/abrir/route');
    const req = new NextRequest('http://localhost/api/caja/abrir', {
      method: 'POST',
      body: JSON.stringify({ montoApertura: 1000 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('CAJA_YA_ABIERTA');
  });

  it('rechaza monto negativo', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.sesionCaja.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { POST } = await import('@/app/api/caja/abrir/route');
    const req = new NextRequest('http://localhost/api/caja/abrir', {
      method: 'POST',
      body: JSON.stringify({ montoApertura: -100 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
  });
});

describe('POST /api/caja/cerrar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('cierra la caja activa y calcula diferencia', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.sesionCaja.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockSesionActiva);
    (prisma.pagoFactura.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { monto: 2000 },
    });
    (prisma.sesionCaja.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockSesionActiva,
      estado: 'CERRADA',
      montoCierreDeclarado: 7000,
      montoCierreReal: 7000, // 5000 apertura + 2000 efectivo
      diferencia: 0,
      fechaCierre: new Date(),
    });

    const { POST } = await import('@/app/api/caja/cerrar/route');
    const req = new NextRequest('http://localhost/api/caja/cerrar', {
      method: 'POST',
      body: JSON.stringify({ montoCierreDeclarado: 7000 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.estado).toBe('CERRADA');
  });

  it('retorna error cuando no hay caja abierta', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.sesionCaja.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { POST } = await import('@/app/api/caja/cerrar/route');
    const req = new NextRequest('http://localhost/api/caja/cerrar', {
      method: 'POST',
      body: JSON.stringify({ montoCierreDeclarado: 5000 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('CAJA_NO_ABIERTA');
  });
});
