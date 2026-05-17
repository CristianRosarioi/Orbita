import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_owner' }),
  currentUser: vi.fn().mockResolvedValue({
    id: 'clerk_owner',
    firstName: 'Ana',
    lastName: 'García',
    primaryEmailAddressId: 'email_1',
    emailAddresses: [{ id: 'email_1', emailAddress: 'ana@test.com' }],
    imageUrl: null,
  }),
}));

const mockUsuarioOwner = { id: 'user_owner', clerkId: 'clerk_owner', email: 'ana@test.com', deletedAt: null };
const mockMembresiaOwner = {
  id: 'memb_owner',
  usuarioId: 'user_owner',
  empresaId: 'emp_1',
  rol: 'OWNER',
  activo: true,
  empresa: { id: 'emp_1', nombre: 'Empresa Test' },
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: { findFirst: vi.fn(), create: vi.fn() },
    sesionUsuarioEmpresa: { findUnique: vi.fn(), upsert: vi.fn() },
    miembroEmpresa: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    invitacion: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

function setupOwnerSession() {
  mockPrisma.usuario.findFirst.mockResolvedValue(mockUsuarioOwner);
  mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue({ usuarioId: 'user_owner', empresaActivaId: 'emp_1' });
  mockPrisma.miembroEmpresa.findFirst.mockResolvedValue(mockMembresiaOwner);
}

describe('GET /api/invitaciones', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('retorna invitaciones pendientes para OWNER', async () => {
    setupOwnerSession();
    mockPrisma.invitacion.findMany.mockResolvedValue([
      { id: 'inv_1', email: 'nuevo@test.com', rol: 'VENDEDOR', estado: 'PENDIENTE', token: 'tok_1', expiresAt: new Date() },
    ]);

    const { GET } = await import('@/app/api/invitaciones/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});

describe('POST /api/invitaciones', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('crea invitación correctamente', async () => {
    setupOwnerSession();
    mockPrisma.miembroEmpresa.findFirst
      .mockResolvedValueOnce(mockMembresiaOwner) // requireRole
      .mockResolvedValueOnce(null); // no es miembro
    mockPrisma.invitacion.findFirst.mockResolvedValue(null); // no hay invitación pendiente
    const invCreada = { id: 'inv_1', email: 'nuevo@test.com', rol: 'VENDEDOR', token: 'tok-uuid', expiresAt: new Date() };
    mockPrisma.invitacion.create.mockResolvedValue(invCreada);

    const { POST } = await import('@/app/api/invitaciones/route');
    const req = new Request('http://localhost/api/invitaciones', {
      method: 'POST',
      body: JSON.stringify({ email: 'nuevo@test.com', rol: 'VENDEDOR' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.link).toContain('invitacion?token=');
  });

  it('rechaza invitar con rol OWNER', async () => {
    setupOwnerSession();

    const { POST } = await import('@/app/api/invitaciones/route');
    const req = new Request('http://localhost/api/invitaciones', {
      method: 'POST',
      body: JSON.stringify({ email: 'nuevo@test.com', rol: 'OWNER' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('rechaza si el email ya es miembro', async () => {
    setupOwnerSession();
    mockPrisma.miembroEmpresa.findFirst
      .mockResolvedValueOnce(mockMembresiaOwner) // requireRole
      .mockResolvedValueOnce({ id: 'memb_existente' }); // ya es miembro

    const { POST } = await import('@/app/api/invitaciones/route');
    const req = new Request('http://localhost/api/invitaciones', {
      method: 'POST',
      body: JSON.stringify({ email: 'ana@test.com', rol: 'VENDEDOR' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.message).toContain('miembro');
  });

  it('rechaza si ya hay invitación pendiente para ese email', async () => {
    setupOwnerSession();
    mockPrisma.miembroEmpresa.findFirst
      .mockResolvedValueOnce(mockMembresiaOwner) // requireRole
      .mockResolvedValueOnce(null); // no es miembro
    mockPrisma.invitacion.findFirst.mockResolvedValue({ id: 'inv_existente', estado: 'PENDIENTE' });

    const { POST } = await import('@/app/api/invitaciones/route');
    const req = new Request('http://localhost/api/invitaciones', {
      method: 'POST',
      body: JSON.stringify({ email: 'otro@test.com', rol: 'CAJERO' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.message).toContain('pendiente');
  });
});

describe('GET /api/invitaciones/aceptar', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('retorna info de invitación válida', async () => {
    const empresa = { id: 'emp_1', nombre: 'Empresa Test', nombreComercial: null };
    mockPrisma.invitacion.findUnique.mockResolvedValue({
      id: 'inv_1', email: 'invitado@test.com', rol: 'VENDEDOR',
      estado: 'PENDIENTE', token: 'tok_1', invitadoPor: 'clerk_owner',
      expiresAt: new Date(Date.now() + 3600000), empresa,
    });
    mockPrisma.usuario.findFirst.mockResolvedValue(mockUsuarioOwner);

    const { GET } = await import('@/app/api/invitaciones/aceptar/route');
    const req = new Request('http://localhost/api/invitaciones/aceptar?token=tok_1');
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('invitado@test.com');
    expect(body.data.empresa.nombre).toBe('Empresa Test');
  });

  it('rechaza token inexistente', async () => {
    mockPrisma.invitacion.findUnique.mockResolvedValue(null);

    const { GET } = await import('@/app/api/invitaciones/aceptar/route');
    const req = new Request('http://localhost/api/invitaciones/aceptar?token=invalido');
    const res = await GET(req as never);
    expect(res.status).toBe(404);
  });

  it('rechaza invitación expirada', async () => {
    mockPrisma.invitacion.findUnique.mockResolvedValue({
      id: 'inv_exp', email: 'test@test.com', rol: 'ADMIN',
      estado: 'PENDIENTE', token: 'tok_exp', invitadoPor: 'clerk_owner',
      expiresAt: new Date(Date.now() - 1000), // ya expiró
      empresa: { id: 'emp_1', nombre: 'Empresa' },
    });
    mockPrisma.invitacion.update.mockResolvedValue({});

    const { GET } = await import('@/app/api/invitaciones/aceptar/route');
    const req = new Request('http://localhost/api/invitaciones/aceptar?token=tok_exp');
    const res = await GET(req as never);
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error.message).toContain('expirado');
  });

  it('rechaza sin token en la URL', async () => {
    const { GET } = await import('@/app/api/invitaciones/aceptar/route');
    const req = new Request('http://localhost/api/invitaciones/aceptar');
    const res = await GET(req as never);
    expect(res.status).toBe(400);
  });
});
