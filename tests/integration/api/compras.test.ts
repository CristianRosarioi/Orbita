import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_owner' }),
}));

const mockEmpresa = {
  id: 'emp_1',
  nombre: 'Empresa Test',
  nombreComercial: null,
  industria: 'RETAIL',
  estadoSusc: 'ACTIVO',
  modoFiscal: 'FISCAL',
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
    empresa: { findFirst: vi.fn() },
    proveedor: { findFirst: vi.fn(), findMany: vi.fn() },
    ordenCompra: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    itemOrdenCompra: { findMany: vi.fn(), updateMany: vi.fn() },
    gasto: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    producto: { update: vi.fn() },
    movimientoInventario: { create: vi.fn() },
    cuentaContable: { findFirst: vi.fn() },
    asientoContable: { findFirst: vi.fn(), create: vi.fn() },
    lineaAsiento: { createMany: vi.fn() },
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

// ─── Órdenes de compra ────────────────────────────────────────────

describe('GET /api/compras/ordenes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve lista de órdenes', async () => {
    setupSession();
    mockPrisma.ordenCompra.findMany.mockResolvedValue([
      {
        id: 'ord_1',
        numero: 1,
        estado: 'BORRADOR',
        total: 1000,
        createdAt: new Date(),
        proveedor: { id: 'prov_1', nombre: 'Proveedor A', nombreComercial: null },
        _count: { items: 2 },
      },
    ]);

    const { GET } = await import('@/app/api/compras/ordenes/route');
    const req = new NextRequest('http://localhost/api/compras/ordenes');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it('devuelve 401 si no hay sesión', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

    const { GET } = await import('@/app/api/compras/ordenes/route');
    const req = new NextRequest('http://localhost/api/compras/ordenes');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/compras/ordenes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const bodyValido = {
    proveedorId: 'prov_1',
    items: [
      { descripcion: 'Producto A', cantidad: 10, costoUnitario: 100, itbisPorcentaje: 0 },
    ],
  };

  it('crea orden en BORRADOR', async () => {
    setupSession();
    mockPrisma.proveedor.findFirst.mockResolvedValue({ id: 'prov_1', nombre: 'Proveedor A' });

    const ordenCreada = {
      id: 'ord_new',
      numero: 1,
      estado: 'BORRADOR',
      subtotal: 1000,
      itbis: 0,
      total: 1000,
      proveedor: { id: 'prov_1', nombre: 'Proveedor A' },
      items: [],
    };

    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const txMock = {
        ordenCompra: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(ordenCreada),
        },
      };
      return fn(txMock);
    });

    const { POST } = await import('@/app/api/compras/ordenes/route');
    const req = new NextRequest('http://localhost/api/compras/ordenes', {
      method: 'POST',
      body: JSON.stringify(bodyValido),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.estado).toBe('BORRADOR');
  });

  it('devuelve 404 si el proveedor no existe', async () => {
    setupSession();
    mockPrisma.proveedor.findFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/compras/ordenes/route');
    const req = new NextRequest('http://localhost/api/compras/ordenes', {
      method: 'POST',
      body: JSON.stringify(bodyValido),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('devuelve 422 si los datos son inválidos', async () => {
    setupSession();

    const { POST } = await import('@/app/api/compras/ordenes/route');
    const req = new NextRequest('http://localhost/api/compras/ordenes', {
      method: 'POST',
      body: JSON.stringify({ proveedorId: '', items: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

describe('POST /api/compras/ordenes/[id]/enviar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cambia estado BORRADOR → ENVIADA', async () => {
    setupSession();
    mockPrisma.ordenCompra.findFirst.mockResolvedValue({
      id: 'ord_1',
      empresaId: 'emp_1',
      estado: 'BORRADOR',
    });
    mockPrisma.ordenCompra.update.mockResolvedValue({
      id: 'ord_1',
      estado: 'ENVIADA',
      fechaEnvio: new Date(),
    });

    const { POST } = await import('@/app/api/compras/ordenes/[id]/enviar/route');
    const req = new NextRequest('http://localhost/api/compras/ordenes/ord_1/enviar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'ord_1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.estado).toBe('ENVIADA');
  });

  it('devuelve 422 si ya fue enviada', async () => {
    setupSession();
    mockPrisma.ordenCompra.findFirst.mockResolvedValue({
      id: 'ord_1',
      empresaId: 'emp_1',
      estado: 'ENVIADA',
    });

    const { POST } = await import('@/app/api/compras/ordenes/[id]/enviar/route');
    const req = new NextRequest('http://localhost/api/compras/ordenes/ord_1/enviar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'ord_1' }) });
    expect(res.status).toBe(422);
  });
});

// ─── Gastos ───────────────────────────────────────────────────────

describe('GET /api/compras/gastos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve lista de gastos', async () => {
    setupSession();
    mockPrisma.gasto.findMany.mockResolvedValue([
      {
        id: 'gasto_1',
        descripcion: 'Electricidad',
        monto: 5000,
        itbis: 0,
        total: 5000,
        estado: 'PENDIENTE',
        fechaGasto: new Date(),
        proveedor: null,
      },
    ]);

    const { GET } = await import('@/app/api/compras/gastos/route');
    const req = new NextRequest('http://localhost/api/compras/gastos');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});

describe('POST /api/compras/gastos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const gastoValido = {
    descripcion: 'Pago de renta',
    monto: 15000,
    itbis: 0,
    fechaGasto: '2026-05-01',
    categoria: 'ALQUILER',
  };

  it('registra gasto y crea asiento contable', async () => {
    setupSession();

    const gastoCreado = {
      id: 'gasto_new',
      descripcion: 'Pago de renta',
      monto: 15000,
      itbis: 0,
      total: 15000,
      estado: 'PENDIENTE',
      proveedor: null,
    };

    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const txMock = {
        gasto: {
          create: vi.fn().mockResolvedValue(gastoCreado),
          findFirst: vi.fn().mockResolvedValue(gastoCreado),
        },
        cuentaContable: {
          findFirst: vi.fn().mockResolvedValue({ id: 'cuenta_5002' }),
        },
        asientoContable: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 'asiento_1' }),
        },
        lineaAsiento: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
      };
      return fn(txMock);
    });

    const { POST } = await import('@/app/api/compras/gastos/route');
    const req = new NextRequest('http://localhost/api/compras/gastos', {
      method: 'POST',
      body: JSON.stringify(gastoValido),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.descripcion).toBe('Pago de renta');
  });

  it('devuelve 422 si monto es 0', async () => {
    setupSession();

    const { POST } = await import('@/app/api/compras/gastos/route');
    const req = new NextRequest('http://localhost/api/compras/gastos', {
      method: 'POST',
      body: JSON.stringify({ ...gastoValido, monto: 0 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

describe('PATCH /api/compras/gastos/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marca gasto como PAGADO', async () => {
    setupSession();
    mockPrisma.gasto.findFirst.mockResolvedValue({
      id: 'gasto_1',
      empresaId: 'emp_1',
      estado: 'PENDIENTE',
    });
    mockPrisma.gasto.update.mockResolvedValue({
      id: 'gasto_1',
      estado: 'PAGADO',
      fechaPago: new Date(),
      proveedor: { nombre: 'Proveedor A' },
    });

    const { PATCH } = await import('@/app/api/compras/gastos/[id]/route');
    const req = new NextRequest('http://localhost/api/compras/gastos/gasto_1', {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'PAGADO' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'gasto_1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.estado).toBe('PAGADO');
  });
});

// ─── Reporte 607 ──────────────────────────────────────────────────

describe('GET /api/reportes/607', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna gastos del período con totales correctos', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk_owner' } as never);

    mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue(mockSesion);
    mockPrisma.empresa.findFirst.mockResolvedValue({
      rnc: '101234567',
      nombre: 'Empresa Test',
      modoFiscal: 'FISCAL',
    });
    mockPrisma.gasto.findMany.mockResolvedValue([
      {
        id: 'g1',
        fechaGasto: new Date(2026, 4, 5),
        descripcion: 'Compra suministros',
        categoria: 'OTROS',
        monto: 1000,
        itbis: 180,
        total: 1180,
        estado: 'PAGADO',
        ncfProveedor: 'B0100000001',
        comprobante: null,
        proveedor: { nombre: 'Tech Store', nombreComercial: null, identificacion: '12345678901' },
      },
      {
        id: 'g2',
        fechaGasto: new Date(2026, 4, 10),
        descripcion: 'Gasolina',
        categoria: 'TRANSPORTE',
        monto: 500,
        itbis: 0,
        total: 500,
        estado: 'PENDIENTE',
        ncfProveedor: null,
        comprobante: null,
        proveedor: null,
      },
    ]);

    const { GET } = await import('@/app/api/reportes/607/route');
    const req = new Request('http://localhost/api/reportes/607?mes=5&anio=2026');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.cantidadRegistros).toBe(2);
    expect(body.data.totalGeneral).toBe(1680);
    expect(body.data.totalITBIS).toBe(180);
  });

  it('devuelve 422 sin parámetros mes/año', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk_owner' } as never);
    mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue(mockSesion);

    const { GET } = await import('@/app/api/reportes/607/route');
    const req = new Request('http://localhost/api/reportes/607');
    const res = await GET(req);
    expect(res.status).toBe(422);
  });
});
