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

const mockUsuarioOwner = {
  id: 'user_owner',
  clerkId: 'clerk_owner',
  email: 'ana@test.com',
  deletedAt: null,
};
const mockUsuarioAdmin = {
  id: 'user_admin',
  clerkId: 'clerk_admin',
  email: 'admin@test.com',
  deletedAt: null,
};
const mockMembresiaOwner = {
  id: 'memb_owner',
  usuarioId: 'user_owner',
  empresaId: 'emp_1',
  rol: 'OWNER',
  activo: true,
  empresa: { id: 'emp_1', nombre: 'Empresa Test' },
  usuario: mockUsuarioOwner,
};
const mockMembresiaAdmin = {
  id: 'memb_admin',
  usuarioId: 'user_admin',
  empresaId: 'emp_1',
  rol: 'ADMIN',
  activo: true,
  empresa: { id: 'emp_1' },
  usuario: mockUsuarioAdmin,
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: { findFirst: vi.fn() },
    sesionUsuarioEmpresa: { findUnique: vi.fn() },
    miembroEmpresa: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as typeof prisma & {
  usuario: { findFirst: ReturnType<typeof vi.fn> };
  sesionUsuarioEmpresa: { findUnique: ReturnType<typeof vi.fn> };
  miembroEmpresa: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

function setupOwnerSession() {
  mockPrisma.usuario.findFirst.mockResolvedValue(mockUsuarioOwner);
  mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue({
    usuarioId: 'user_owner',
    empresaActivaId: 'emp_1',
  });
  mockPrisma.miembroEmpresa.findFirst.mockResolvedValue(mockMembresiaOwner);
}

describe('GET /api/usuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna lista de miembros para OWNER', async () => {
    setupOwnerSession();
    mockPrisma.miembroEmpresa.findMany.mockResolvedValue([mockMembresiaOwner, mockMembresiaAdmin]);

    const { GET } = await import('@/app/api/usuarios/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(2);
  });
});

describe('PATCH /api/usuarios/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cambia el rol de un miembro correctamente', async () => {
    setupOwnerSession();
    mockPrisma.miembroEmpresa.findFirst
      .mockResolvedValueOnce(mockMembresiaOwner) // requireRole
      .mockResolvedValueOnce({ ...mockMembresiaAdmin, rol: 'ADMIN' }); // buscar miembro
    mockPrisma.miembroEmpresa.update.mockResolvedValue({
      ...mockMembresiaAdmin,
      rol: 'CONTADOR',
      usuario: mockUsuarioAdmin,
    });

    const { PATCH } = await import('@/app/api/usuarios/[id]/route');
    const req = new Request('http://localhost/api/usuarios/memb_admin', {
      method: 'PATCH',
      body: JSON.stringify({ rol: 'CONTADOR' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req as never, { params: Promise.resolve({ id: 'memb_admin' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('rechaza cambiar rol de OWNER', async () => {
    setupOwnerSession();
    // requireRole devuelve OWNER para la autenticación
    mockPrisma.miembroEmpresa.findFirst
      .mockResolvedValueOnce(mockMembresiaOwner) // requireRole
      .mockResolvedValueOnce({ ...mockMembresiaOwner }); // buscar miembro — también es OWNER

    const { PATCH } = await import('@/app/api/usuarios/[id]/route');
    const req = new Request('http://localhost/api/usuarios/memb_owner', {
      method: 'PATCH',
      body: JSON.stringify({ rol: 'ADMIN' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req as never, { params: Promise.resolve({ id: 'memb_owner' }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toContain('Propietario');
  });

  it('rechaza rol OWNER en el body', async () => {
    setupOwnerSession();
    mockPrisma.miembroEmpresa.findFirst.mockResolvedValue(mockMembresiaOwner);

    const { PATCH } = await import('@/app/api/usuarios/[id]/route');
    const req = new Request('http://localhost/api/usuarios/memb_admin', {
      method: 'PATCH',
      body: JSON.stringify({ rol: 'OWNER' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req as never, { params: Promise.resolve({ id: 'memb_admin' }) });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});

describe('DELETE /api/usuarios/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('remueve un miembro correctamente', async () => {
    setupOwnerSession();
    mockPrisma.miembroEmpresa.findFirst
      .mockResolvedValueOnce(mockMembresiaOwner) // requireRole
      .mockResolvedValueOnce({ ...mockMembresiaAdmin, usuario: { id: 'user_admin' } }); // buscar miembro
    mockPrisma.miembroEmpresa.update.mockResolvedValue({ ...mockMembresiaAdmin, activo: false });

    const { DELETE } = await import('@/app/api/usuarios/[id]/route');
    const res = await DELETE(new Request('http://localhost') as never, {
      params: Promise.resolve({ id: 'memb_admin' }),
    });
    expect(res.status).toBe(200);
  });

  it('rechaza remover al OWNER', async () => {
    setupOwnerSession();
    mockPrisma.miembroEmpresa.findFirst
      .mockResolvedValueOnce(mockMembresiaOwner) // requireRole
      .mockResolvedValueOnce({ ...mockMembresiaOwner, usuario: { id: 'user_owner' } }); // buscar miembro (también OWNER)

    const { DELETE } = await import('@/app/api/usuarios/[id]/route');
    const res = await DELETE(new Request('http://localhost') as never, {
      params: Promise.resolve({ id: 'memb_owner' }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.message).toContain('Propietario');
  });

  it('no permite que ADMIN llame DELETE', async () => {
    mockPrisma.usuario.findFirst.mockResolvedValue(mockUsuarioAdmin);
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue({
      usuarioId: 'user_admin',
      empresaActivaId: 'emp_1',
    });
    mockPrisma.miembroEmpresa.findFirst.mockResolvedValue(mockMembresiaAdmin); // ADMIN

    const { DELETE } = await import('@/app/api/usuarios/[id]/route');
    const res = await DELETE(new Request('http://localhost') as never, {
      params: Promise.resolve({ id: 'memb_otro' }),
    });
    expect(res.status).toBe(403);
  });
});
