import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Industria, ModoFiscal } from '@/types/enums';

/**
 * Tests de integración del endpoint POST /api/empresas/crear.
 *
 * Estos tests mockean Clerk (autenticación) y Prisma (BD) para probar
 * la lógica de validación y respuesta sin necesitar infraestructura real.
 * Los tests de integración con BD real van en tests/integration/api/empresas-crear.db.test.ts
 */

// Mock de Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
  currentUser: vi.fn().mockResolvedValue({
    id: 'clerk_test_user',
    firstName: 'Juan',
    lastName: 'Pérez',
    primaryEmailAddressId: 'email_1',
    emailAddresses: [{ id: 'email_1', emailAddress: 'juan@test.com' }],
    imageUrl: null,
  }),
}));

// Mock de Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    empresa: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const bodyValido = {
  nombre: 'Empresa de Prueba',
  industria: Industria.COLMADO,
  modoFiscal: ModoFiscal.SIMPLE,
};

describe('POST /api/empresas/crear', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza body vacío con 400', async () => {
    const { POST } = await import('@/app/api/empresas/crear/route');
    const req = new Request('http://localhost/api/empresas/crear', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('rechaza modo FISCAL sin RNC con 422', async () => {
    const { POST } = await import('@/app/api/empresas/crear/route');
    const req = new Request('http://localhost/api/empresas/crear', {
      method: 'POST',
      body: JSON.stringify({ ...bodyValido, modoFiscal: ModoFiscal.FISCAL }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza nombre demasiado corto con 422', async () => {
    const { POST } = await import('@/app/api/empresas/crear/route');
    const req = new Request('http://localhost/api/empresas/crear', {
      method: 'POST',
      body: JSON.stringify({ ...bodyValido, nombre: 'X' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
  });

  it('acepta datos válidos en modo SIMPLE y devuelve 201', async () => {
    const { prisma } = await import('@/lib/prisma');
    const mockPrisma = prisma as unknown as {
      usuario: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
      empresa: { findFirst: ReturnType<typeof vi.fn> };
      $transaction: ReturnType<typeof vi.fn>;
    };

    const mockUsuario = { id: 'usr_1', clerkId: 'clerk_test_user', email: 'juan@test.com' };
    const mockEmpresa = { id: 'emp_1', nombre: 'Empresa de Prueba' };
    const mockSucursal = { id: 'suc_1', nombre: 'Principal' };

    mockPrisma.usuario.findFirst.mockResolvedValue(mockUsuario);
    mockPrisma.empresa.findFirst.mockResolvedValue(null); // Sin RNC duplicado
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        empresa: { create: vi.fn().mockResolvedValue(mockEmpresa) },
        miembroEmpresa: { create: vi.fn().mockResolvedValue({}) },
        sucursal: { create: vi.fn().mockResolvedValue(mockSucursal) },
        sesionUsuarioEmpresa: { upsert: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const { POST } = await import('@/app/api/empresas/crear/route');
    const req = new Request('http://localhost/api/empresas/crear', {
      method: 'POST',
      body: JSON.stringify(bodyValido),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.empresa.id).toBe('emp_1');
  });
});
