import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_1' }),
}));

const mockEmpresa = {
  id: 'emp_1',
  nombre: 'El Buen Sabor',
  industria: 'RESTAURANTE',
};

const mockMesa = {
  id: 'mesa_1',
  empresaId: 'emp_1',
  numero: 1,
  nombre: 'Terraza',
  capacidad: 4,
  estado: 'DISPONIBLE',
  activa: true,
  comandas: [],
};

const mockComanda = {
  id: 'comanda_1',
  empresaId: 'emp_1',
  mesaId: 'mesa_1',
  numero: 1,
  estado: 'ABIERTA',
  subtotal: 0,
  itbis: 0,
  propina: 0,
  total: 0,
  personas: 2,
  mesero: 'Carlos',
  notas: null,
  createdAt: new Date(),
  mesa: mockMesa,
  items: [],
  _count: { items: 0 },
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: { findFirst: vi.fn() },
    sesionUsuarioEmpresa: { findUnique: vi.fn() },
    miembroEmpresa: { findFirst: vi.fn() },
    empresa: { findFirst: vi.fn() },
    mesa: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    comanda: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    itemComanda: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

function setupSession(industria = 'RESTAURANTE') {
  mockPrisma.usuario.findFirst.mockResolvedValue({
    id: 'user_1',
    clerkId: 'clerk_1',
    deletedAt: null,
  });
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

describe('GET /api/restaurante/mesas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('retorna lista de mesas de la empresa', async () => {
    mockPrisma.mesa.findMany.mockResolvedValue([mockMesa]);

    const { GET } = await import('@/app/api/restaurante/mesas/route');
    const req = new Request('http://localhost/api/restaurante/mesas');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0].numero).toBe(1);
  });

  it('retorna 403 si la empresa no es restaurante', async () => {
    setupSession('RETAIL');

    const { GET } = await import('@/app/api/restaurante/mesas/route');
    const req = new Request('http://localhost/api/restaurante/mesas');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
  });
});

describe('POST /api/restaurante/mesas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('crea una mesa válida', async () => {
    mockPrisma.mesa.findFirst.mockResolvedValue(null);
    mockPrisma.mesa.create.mockResolvedValue(mockMesa);

    const { POST } = await import('@/app/api/restaurante/mesas/route');
    const req = new Request('http://localhost/api/restaurante/mesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: 1, capacidad: 4 }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.numero).toBe(1);
  });

  it('retorna 409 si el número de mesa ya existe', async () => {
    mockPrisma.mesa.findFirst.mockResolvedValue(mockMesa);

    const { POST } = await import('@/app/api/restaurante/mesas/route');
    const req = new Request('http://localhost/api/restaurante/mesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: 1 }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
  });

  it('retorna 422 si numero es inválido', async () => {
    const { POST } = await import('@/app/api/restaurante/mesas/route');
    const req = new Request('http://localhost/api/restaurante/mesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: 0 }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
  });
});

describe('GET /api/restaurante/cocina', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSession();
  });

  it('retorna comandas activas para cocina', async () => {
    const mockComandaCocina = {
      id: 'comanda_1',
      numero: 1,
      estado: 'ABIERTA',
      createdAt: new Date(),
      mesa: { numero: 1, nombre: null },
      items: [
        {
          id: 'item_1',
          nombre: 'Pollo guisado',
          cantidad: 2,
          estado: 'PENDIENTE',
          notas: null,
          createdAt: new Date(),
        },
      ],
    };
    mockPrisma.comanda.findMany.mockResolvedValue([mockComandaCocina]);

    const { GET } = await import('@/app/api/restaurante/cocina/route');
    const req = new Request('http://localhost/api/restaurante/cocina');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].estado).toBe('ABIERTA');
    expect(body.data[0].items).toHaveLength(1);
  });
});
