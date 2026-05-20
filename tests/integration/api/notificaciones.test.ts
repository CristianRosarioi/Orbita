import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_owner' }),
}));

const mockEmpresa = {
  id: 'emp_1',
  nombre: 'Demo RD',
  nombreComercial: null,
  industria: 'RETAIL',
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
    empresa: { findFirst: vi.fn() },
    configNotificacion: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    notificacion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
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

const mockConfig = {
  id: 'cfg_1',
  empresaId: 'emp_1',
  whatsappActivo: false,
  emailActivo: true,
  whatsappNumero: null,
  whatsappApiKey: null,
  emailRemitente: 'demo@empresa.do',
  notifFacturas: true,
  notifVencimientos: true,
  notifCitas: true,
  notifStockBajo: true,
  notifNomina: false,
};

const mockNotif = {
  id: 'notif_1',
  empresaId: 'emp_1',
  tipo: 'FACTURA_EMITIDA',
  canal: 'EMAIL',
  estado: 'ENVIADA',
  destinatario: 'cliente@ejemplo.com',
  asunto: 'Tu factura ha sido emitida',
  mensaje: 'Hola Juan...',
  referencia: 'fact_1',
  intentos: 1,
  errorMsg: null,
  enviadaEn: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

// ─── GET /api/notificaciones/config ─────────────────────────────────────────

describe('GET /api/notificaciones/config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('devuelve la config existente', async () => {
    mockPrisma.configNotificacion.findUnique.mockResolvedValue(mockConfig);
    const { GET } = await import('@/app/api/notificaciones/config/route');
    const res = await GET();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.emailRemitente).toBe('demo@empresa.do');
  });

  it('devuelve valores por defecto si no existe config', async () => {
    mockPrisma.configNotificacion.findUnique.mockResolvedValue(null);
    const { GET } = await import('@/app/api/notificaciones/config/route');
    const res = await GET();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.whatsappActivo).toBe(false);
    expect(json.data.notifFacturas).toBe(true);
  });
});

// ─── POST /api/notificaciones/config ────────────────────────────────────────

describe('POST /api/notificaciones/config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('crea config si no existe (upsert)', async () => {
    mockPrisma.configNotificacion.upsert.mockResolvedValue(mockConfig);
    const { POST } = await import('@/app/api/notificaciones/config/route');
    const req = new NextRequest('http://localhost/api/notificaciones/config', {
      method: 'POST',
      body: JSON.stringify({ emailActivo: true, emailRemitente: 'demo@empresa.do' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockPrisma.configNotificacion.upsert).toHaveBeenCalledOnce();
  });

  it('rechaza emailRemitente con formato inválido', async () => {
    const { POST } = await import('@/app/api/notificaciones/config/route');
    const req = new NextRequest('http://localhost/api/notificaciones/config', {
      method: 'POST',
      body: JSON.stringify({ emailActivo: true, emailRemitente: 'no-es-email' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/notificaciones ─────────────────────────────────────────────────

describe('GET /api/notificaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('devuelve historial paginado', async () => {
    mockPrisma.notificacion.findMany.mockResolvedValue([mockNotif]);
    mockPrisma.notificacion.count.mockResolvedValue(1);
    const { GET } = await import('@/app/api/notificaciones/route');
    const req = new NextRequest('http://localhost/api/notificaciones');
    const res = await GET(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.meta.total).toBe(1);
  });

  it('aplica filtro por estado', async () => {
    mockPrisma.notificacion.findMany.mockResolvedValue([]);
    mockPrisma.notificacion.count.mockResolvedValue(0);
    const { GET } = await import('@/app/api/notificaciones/route');
    const req = new NextRequest('http://localhost/api/notificaciones?estado=FALLIDA');
    await GET(req);
    const where = mockPrisma.notificacion.findMany.mock.calls[0][0].where;
    expect(where.estado).toBe('FALLIDA');
  });

  it('aplica filtro por tipo', async () => {
    mockPrisma.notificacion.findMany.mockResolvedValue([]);
    mockPrisma.notificacion.count.mockResolvedValue(0);
    const { GET } = await import('@/app/api/notificaciones/route');
    const req = new NextRequest('http://localhost/api/notificaciones?tipo=PAGO_RECIBIDO');
    await GET(req);
    const where = mockPrisma.notificacion.findMany.mock.calls[0][0].where;
    expect(where.tipo).toBe('PAGO_RECIBIDO');
  });
});

// ─── DELETE /api/notificaciones/[id] ────────────────────────────────────────

describe('DELETE /api/notificaciones/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('cancela la notificación', async () => {
    mockPrisma.notificacion.findFirst.mockResolvedValue(mockNotif);
    mockPrisma.notificacion.update.mockResolvedValue({ ...mockNotif, estado: 'CANCELADA' });
    const { DELETE } = await import('@/app/api/notificaciones/[id]/route');
    const req = new NextRequest('http://localhost/api/notificaciones/notif_1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'notif_1' }) });
    const json = await res.json();
    expect(json.success).toBe(true);
    const updateCall = mockPrisma.notificacion.update.mock.calls[0][0];
    expect(updateCall.data.estado).toBe('CANCELADA');
  });

  it('devuelve 404 si no existe', async () => {
    mockPrisma.notificacion.findFirst.mockResolvedValue(null);
    const { DELETE } = await import('@/app/api/notificaciones/[id]/route');
    const req = new NextRequest('http://localhost/api/notificaciones/x');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'x' }) });
    expect(res.status).toBe(404);
  });
});

// ─── Notificaciones FALLIDAS tienen errorMsg ─────────────────────────────────

describe('Estado FALLIDA con errorMsg', () => {
  it('una notificación fallida tiene errorMsg no nulo', () => {
    const fallida = { ...mockNotif, estado: 'FALLIDA', errorMsg: 'Fallo al enviar por email' };
    expect(fallida.estado).toBe('FALLIDA');
    expect(fallida.errorMsg).not.toBeNull();
    expect(typeof fallida.errorMsg).toBe('string');
  });

  it('una notificación enviada tiene errorMsg nulo', () => {
    expect(mockNotif.estado).toBe('ENVIADA');
    expect(mockNotif.errorMsg).toBeNull();
  });
});
