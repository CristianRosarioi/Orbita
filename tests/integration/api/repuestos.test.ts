import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_1' }),
}));

const mockSesion = {
  usuarioId: 'usr_1',
  empresaActivaId: 'emp_1',
  empresaActiva: { id: 'emp_1', nombre: 'Repuestos El Motor', industria: 'REPUESTOS' },
  sucursalActiva: null,
};

const mockRepuesto = {
  id: 'rep_1',
  empresaId: 'emp_1',
  codigo: 'REP-001',
  nombre: 'Filtro de aceite',
  descripcion: null,
  marca: 'Bosch',
  marcaVehiculo: 'Toyota',
  modeloVehiculo: 'Corolla',
  anioDesde: 2015,
  anioHasta: 2024,
  precio: 650,
  precioMayor: null,
  stock: 10,
  stockMinimo: 2,
  ubicacion: null,
  activo: true,
  creadoPor: 'clerk_1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockCotizacion = {
  id: 'cot_1',
  empresaId: 'emp_1',
  numero: 1,
  clienteId: null,
  clienteNombre: 'María García',
  clienteTelefono: null,
  vehiculoMarca: 'Toyota',
  vehiculoModelo: 'Corolla',
  vehiculoAnio: 2020,
  vehiculoPlaca: null,
  estado: 'PENDIENTE',
  subtotal: 1300,
  itbis: 234,
  total: 1534,
  notas: null,
  validaHasta: null,
  facturaId: null,
  creadoPor: 'clerk_1',
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    {
      id: 'item_1',
      cotizacionId: 'cot_1',
      repuestoId: null,
      descripcion: 'Filtro de aceite',
      cantidad: 2,
      precioUnitario: 650,
      itbisPorcentaje: 18,
      itbisMonto: 117,
      subtotal: 1300,
      total: 1534,
      createdAt: new Date(),
    },
  ],
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: { findFirst: vi.fn() },
    sesionUsuarioEmpresa: { findUnique: vi.fn() },
    repuesto: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    cotizacion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    cliente: { findFirst: vi.fn() },
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

describe('GET /api/repuestos/inventario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentEmpresa.mockResolvedValue(mockSesion);
    mockPrisma.repuesto.findMany.mockResolvedValue([mockRepuesto]);
    mockPrisma.repuesto.count.mockResolvedValue(1);
  });

  it('devuelve lista de repuestos', async () => {
    const { GET } = await import('@/app/api/repuestos/inventario/route');
    const req = new NextRequest('http://localhost/api/repuestos/inventario');
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('devuelve 403 si no es REPUESTOS', async () => {
    mockGetCurrentEmpresa.mockResolvedValueOnce({
      ...mockSesion,
      empresaActiva: { ...mockSesion.empresaActiva, industria: 'CARWASH' },
    });
    const { GET } = await import('@/app/api/repuestos/inventario/route');
    const req = new NextRequest('http://localhost/api/repuestos/inventario');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/repuestos/inventario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentEmpresa.mockResolvedValue(mockSesion);
    mockPrisma.repuesto.findFirst.mockResolvedValue(null);
    mockPrisma.repuesto.create.mockResolvedValue(mockRepuesto);
  });

  it('crea un repuesto con datos válidos', async () => {
    const { POST } = await import('@/app/api/repuestos/inventario/route');
    const req = new NextRequest('http://localhost/api/repuestos/inventario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: 'REP-001', nombre: 'Filtro de aceite', precio: 650 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('rechaza datos inválidos — falta precio', async () => {
    const { POST } = await import('@/app/api/repuestos/inventario/route');
    const req = new NextRequest('http://localhost/api/repuestos/inventario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: 'REP-001', nombre: 'Filtro de aceite' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it('rechaza código duplicado', async () => {
    mockPrisma.repuesto.findFirst.mockResolvedValueOnce(mockRepuesto);
    const { POST } = await import('@/app/api/repuestos/inventario/route');
    const req = new NextRequest('http://localhost/api/repuestos/inventario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: 'REP-001', nombre: 'Filtro de aceite', precio: 650 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/repuestos/cotizaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentEmpresa.mockResolvedValue(mockSesion);
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        cotizacion: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(mockCotizacion),
        },
      }),
    );
  });

  it('crea una cotización con ítems válidos', async () => {
    const { POST } = await import('@/app/api/repuestos/cotizaciones/route');
    const req = new NextRequest('http://localhost/api/repuestos/cotizaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteNombre: 'María García',
        items: [{ descripcion: 'Filtro de aceite', cantidad: 2, precioUnitario: 650, itbisPorcentaje: 18 }],
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('rechaza cotización sin ítems', async () => {
    const { POST } = await import('@/app/api/repuestos/cotizaciones/route');
    const req = new NextRequest('http://localhost/api/repuestos/cotizaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteNombre: 'María García', items: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

describe('PATCH /api/repuestos/cotizaciones/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentEmpresa.mockResolvedValue(mockSesion);
    mockPrisma.cotizacion.findFirst.mockResolvedValue(mockCotizacion);
    mockPrisma.cotizacion.update.mockResolvedValue({ ...mockCotizacion, estado: 'APROBADA' });
  });

  it('actualiza el estado a APROBADA', async () => {
    const { PATCH } = await import('@/app/api/repuestos/cotizaciones/[id]/route');
    const req = new NextRequest('http://localhost/api/repuestos/cotizaciones/cot_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'APROBADA' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'cot_1' }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('rechaza modificar cotización FACTURADA', async () => {
    mockPrisma.cotizacion.findFirst.mockResolvedValueOnce({ ...mockCotizacion, estado: 'FACTURADA' });
    const { PATCH } = await import('@/app/api/repuestos/cotizaciones/[id]/route');
    const req = new NextRequest('http://localhost/api/repuestos/cotizaciones/cot_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'PENDIENTE' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'cot_1' }) });
    expect(res.status).toBe(409);
  });

  it('rechaza estado inválido', async () => {
    const { PATCH } = await import('@/app/api/repuestos/cotizaciones/[id]/route');
    const req = new NextRequest('http://localhost/api/repuestos/cotizaciones/cot_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'INVALIDO' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'cot_1' }) });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/repuestos/buscar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentEmpresa.mockResolvedValue(mockSesion);
    mockPrisma.repuesto.findMany.mockResolvedValue([mockRepuesto]);
  });

  it('busca repuestos por marca de vehículo', async () => {
    const { GET } = await import('@/app/api/repuestos/buscar/route');
    const req = new NextRequest('http://localhost/api/repuestos/buscar?marca=Toyota');
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('devuelve 422 sin criterios de búsqueda', async () => {
    const { GET } = await import('@/app/api/repuestos/buscar/route');
    const req = new NextRequest('http://localhost/api/repuestos/buscar');
    const res = await GET(req);
    expect(res.status).toBe(422);
  });
});
