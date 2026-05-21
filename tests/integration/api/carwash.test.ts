import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_1' }),
}));

const mockSesion = {
  usuarioId: 'usr_1',
  empresaActivaId: 'emp_1',
  empresaActiva: { id: 'emp_1', nombre: 'Carwash Express', industria: 'CARWASH' },
  sucursalActiva: null,
};

const mockOrden = {
  id: 'ord_1',
  empresaId: 'emp_1',
  numero: 1,
  clienteId: null,
  clienteNombre: 'Juan Pérez',
  clienteTelefono: '829-555-0000',
  vehiculoPlaca: 'A123456',
  vehiculoMarca: 'Toyota',
  vehiculoModelo: 'Corolla',
  vehiculoColor: 'Rojo',
  tipoServicio: 'Lavado completo',
  duracionMin: 30,
  precio: 800,
  estado: 'EN_COLA',
  empleadoAsignado: null,
  notas: null,
  facturaId: null,
  creadoPor: 'clerk_1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  cliente: null,
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: { findFirst: vi.fn() },
    sesionUsuarioEmpresa: { findUnique: vi.fn() },
    ordenCarwash: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  getCurrentEmpresa: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getCurrentEmpresa } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetCurrentEmpresa = getCurrentEmpresa as any;

function makeReq(body?: unknown, url = 'http://localhost/api/carwash/ordenes') {
  return new NextRequest(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('GET /api/carwash/cola', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentEmpresa.mockResolvedValue(mockSesion);
    mockPrisma.ordenCarwash.findMany.mockResolvedValue([mockOrden]);
  });

  it('devuelve las órdenes en cola', async () => {
    const { GET } = await import('@/app/api/carwash/cola/route');
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('devuelve 401 sin sesión de Clerk', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);
    const { GET } = await import('@/app/api/carwash/cola/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('devuelve 403 si la empresa no es CARWASH', async () => {
    mockGetCurrentEmpresa.mockResolvedValueOnce({
      ...mockSesion,
      empresaActiva: { ...mockSesion.empresaActiva, industria: 'RESTAURANTE' },
    });
    const { GET } = await import('@/app/api/carwash/cola/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });
});

describe('POST /api/carwash/ordenes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentEmpresa.mockResolvedValue(mockSesion);
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        ordenCarwash: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(mockOrden),
        },
      }),
    );
  });

  it('crea una orden con datos válidos', async () => {
    const { POST } = await import('@/app/api/carwash/ordenes/route');
    const req = makeReq({
      clienteNombre: 'Juan Pérez',
      vehiculoPlaca: 'A123456',
      tipoServicio: 'Lavado completo',
      precio: 800,
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('rechaza datos inválidos — falta precio', async () => {
    const { POST } = await import('@/app/api/carwash/ordenes/route');
    const req = makeReq({
      clienteNombre: 'Juan Pérez',
      vehiculoPlaca: 'A123456',
      tipoServicio: 'Lavado completo',
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it('rechaza si vehiculoPlaca está vacía', async () => {
    const { POST } = await import('@/app/api/carwash/ordenes/route');
    const req = makeReq({
      clienteNombre: 'Juan Pérez',
      vehiculoPlaca: '',
      tipoServicio: 'Lavado completo',
      precio: 800,
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

describe('PATCH /api/carwash/ordenes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentEmpresa.mockResolvedValue(mockSesion);
    mockPrisma.ordenCarwash.findFirst.mockResolvedValue(mockOrden);
    mockPrisma.ordenCarwash.update.mockResolvedValue({ ...mockOrden, estado: 'EN_PROCESO' });
  });

  it('actualiza el estado de la orden', async () => {
    const { PATCH } = await import('@/app/api/carwash/ordenes/[id]/route');
    const req = new NextRequest('http://localhost/api/carwash/ordenes/ord_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'EN_PROCESO' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ord_1' }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('devuelve 404 si la orden no existe', async () => {
    mockPrisma.ordenCarwash.findFirst.mockResolvedValueOnce(null);
    const { PATCH } = await import('@/app/api/carwash/ordenes/[id]/route');
    const req = new NextRequest('http://localhost/api/carwash/ordenes/no_existe', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'EN_PROCESO' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'no_existe' }) });
    expect(res.status).toBe(404);
  });

  it('rechaza modificar una orden ENTREGADA', async () => {
    mockPrisma.ordenCarwash.findFirst.mockResolvedValueOnce({ ...mockOrden, estado: 'ENTREGADO' });
    const { PATCH } = await import('@/app/api/carwash/ordenes/[id]/route');
    const req = new NextRequest('http://localhost/api/carwash/ordenes/ord_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'EN_PROCESO' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ord_1' }) });
    expect(res.status).toBe(409);
  });
});
