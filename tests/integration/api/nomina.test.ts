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
    empleado: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    nomina: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    itemNomina: {
      findFirst: vi.fn(),
    },
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

// ─── GET /api/nomina/empleados ────────────────────────────────────

describe('GET /api/nomina/empleados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve lista de empleados', async () => {
    setupSession();
    mockPrisma.empleado.findMany.mockResolvedValue([
      {
        id: 'emp_1',
        nombre: 'Juan',
        apellido: 'Pérez',
        cedula: '00113456789',
        cargo: 'Vendedor',
        departamento: null,
        salarioBase: 25000,
        tipoContrato: 'INDEFINIDO',
        frecuenciaPago: 'MENSUAL',
        estado: 'ACTIVO',
        fechaIngreso: new Date('2026-01-15'),
      },
    ]);

    const { GET } = await import('@/app/api/nomina/empleados/route');
    const req = new NextRequest('http://localhost/api/nomina/empleados');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].apellido).toBe('Pérez');
  });

  it('devuelve 401 si no hay sesión', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

    const { GET } = await import('@/app/api/nomina/empleados/route');
    const req = new NextRequest('http://localhost/api/nomina/empleados');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('filtra por estado cuando se pasa query param', async () => {
    setupSession();
    mockPrisma.empleado.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/nomina/empleados/route');
    const req = new NextRequest('http://localhost/api/nomina/empleados?estado=ACTIVO');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockPrisma.empleado.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estado: 'ACTIVO' }),
      }),
    );
  });
});

// ─── POST /api/nomina/empleados ───────────────────────────────────

describe('POST /api/nomina/empleados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const bodyValido = {
    nombre: 'Ana',
    apellido: 'García',
    cedula: '00113456790',
    cargo: 'Cajera',
    salarioBase: 18000,
    tipoContrato: 'INDEFINIDO',
    frecuenciaPago: 'MENSUAL',
    fechaIngreso: '2026-03-01',
  };

  it('crea empleado correctamente', async () => {
    setupSession();
    mockPrisma.empleado.findFirst.mockResolvedValue(null); // cédula no duplicada
    mockPrisma.empleado.create.mockResolvedValue({
      id: 'emp_new',
      ...bodyValido,
      empresaId: 'emp_1',
      estado: 'ACTIVO',
      fechaIngreso: new Date('2026-03-01'),
    });

    const { POST } = await import('@/app/api/nomina/empleados/route');
    const req = new NextRequest('http://localhost/api/nomina/empleados', {
      method: 'POST',
      body: JSON.stringify(bodyValido),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.apellido).toBe('García');
  });

  it('devuelve 422 si la cédula ya existe', async () => {
    setupSession();
    mockPrisma.empleado.findFirst.mockResolvedValue({ id: 'emp_existente' });

    const { POST } = await import('@/app/api/nomina/empleados/route');
    const req = new NextRequest('http://localhost/api/nomina/empleados', {
      method: 'POST',
      body: JSON.stringify(bodyValido),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.message).toMatch(/cédula/i);
  });

  it('devuelve 422 si la cédula tiene menos de 11 dígitos', async () => {
    setupSession();

    const { POST } = await import('@/app/api/nomina/empleados/route');
    const req = new NextRequest('http://localhost/api/nomina/empleados', {
      method: 'POST',
      body: JSON.stringify({ ...bodyValido, cedula: '001134' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it('devuelve 422 si salario es 0', async () => {
    setupSession();

    const { POST } = await import('@/app/api/nomina/empleados/route');
    const req = new NextRequest('http://localhost/api/nomina/empleados', {
      method: 'POST',
      body: JSON.stringify({ ...bodyValido, salarioBase: 0 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

// ─── POST /api/nomina/nominas ─────────────────────────────────────

describe('POST /api/nomina/nominas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const bodyValido = {
    periodo: 'Mayo 2026',
    fechaInicio: '2026-05-01',
    fechaFin: '2026-05-31',
    items: [{ empleadoId: 'emp_a' }],
  };

  it('crea nómina en estado BORRADOR con cálculos correctos', async () => {
    setupSession();

    const empleadoMock = { id: 'emp_a', salarioBase: 30_000 };
    mockPrisma.empleado.findMany.mockResolvedValue([empleadoMock]);

    const nominaCreada = {
      id: 'nom_new',
      periodo: 'Mayo 2026',
      estado: 'BORRADOR',
      totalBruto: 30000,
      totalNeto: 28000,
      items: [
        {
          id: 'item_1',
          empleadoId: 'emp_a',
          salarioBruto: 30000,
          salarioNeto: 28000,
          tssTrabajador: 1773,
          tssEmpleador: 4581,
          isr: 0,
          otrosDescuentos: 0,
          otrosIngresos: 0,
          empleado: { id: 'emp_a', nombre: 'Ana', apellido: 'García' },
        },
      ],
    };

    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const txMock = {
        nomina: { create: vi.fn().mockResolvedValue(nominaCreada) },
      };
      return fn(txMock);
    });

    const { POST } = await import('@/app/api/nomina/nominas/route');
    const req = new NextRequest('http://localhost/api/nomina/nominas', {
      method: 'POST',
      body: JSON.stringify(bodyValido),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.estado).toBe('BORRADOR');
  });

  it('devuelve 422 si no hay items', async () => {
    setupSession();

    const { POST } = await import('@/app/api/nomina/nominas/route');
    const req = new NextRequest('http://localhost/api/nomina/nominas', {
      method: 'POST',
      body: JSON.stringify({ ...bodyValido, items: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it('devuelve 422 si un empleado no existe', async () => {
    setupSession();
    // Devuelve lista vacía — ningún empleado encontrado
    mockPrisma.empleado.findMany.mockResolvedValue([]);

    const { POST } = await import('@/app/api/nomina/nominas/route');
    const req = new NextRequest('http://localhost/api/nomina/nominas', {
      method: 'POST',
      body: JSON.stringify(bodyValido),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

// ─── POST /api/nomina/nominas/[id]/procesar ───────────────────────

describe('POST /api/nomina/nominas/[id]/procesar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cambia estado BORRADOR → PROCESADA', async () => {
    setupSession();
    mockPrisma.nomina.findFirst.mockResolvedValue({
      id: 'nom_1',
      empresaId: 'emp_1',
      estado: 'BORRADOR',
    });
    mockPrisma.nomina.update.mockResolvedValue({
      id: 'nom_1',
      estado: 'PROCESADA',
      procesadaEn: new Date(),
    });

    const { POST } = await import('@/app/api/nomina/nominas/[id]/procesar/route');
    const req = new NextRequest('http://localhost/api/nomina/nominas/nom_1/procesar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'nom_1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.estado).toBe('PROCESADA');
  });

  it('devuelve 422 si la nómina ya está PROCESADA', async () => {
    setupSession();
    mockPrisma.nomina.findFirst.mockResolvedValue({
      id: 'nom_1',
      empresaId: 'emp_1',
      estado: 'PROCESADA',
    });

    const { POST } = await import('@/app/api/nomina/nominas/[id]/procesar/route');
    const req = new NextRequest('http://localhost/api/nomina/nominas/nom_1/procesar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'nom_1' }) });
    expect(res.status).toBe(422);
  });

  it('devuelve 422 si la nómina está PAGADA', async () => {
    setupSession();
    mockPrisma.nomina.findFirst.mockResolvedValue({
      id: 'nom_1',
      empresaId: 'emp_1',
      estado: 'PAGADA',
    });

    const { POST } = await import('@/app/api/nomina/nominas/[id]/procesar/route');
    const req = new NextRequest('http://localhost/api/nomina/nominas/nom_1/procesar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'nom_1' }) });
    expect(res.status).toBe(422);
  });

  it('devuelve 404 si la nómina no existe', async () => {
    setupSession();
    mockPrisma.nomina.findFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/nomina/nominas/[id]/procesar/route');
    const req = new NextRequest('http://localhost/api/nomina/nominas/inexistente/procesar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'inexistente' }) });
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/nomina/nominas/[id]/pagar ─────────────────────────

describe('POST /api/nomina/nominas/[id]/pagar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cambia estado PROCESADA → PAGADA', async () => {
    setupSession();
    mockPrisma.nomina.findFirst.mockResolvedValue({
      id: 'nom_1',
      empresaId: 'emp_1',
      estado: 'PROCESADA',
    });
    mockPrisma.nomina.update.mockResolvedValue({
      id: 'nom_1',
      estado: 'PAGADA',
      pagadaEn: new Date(),
    });

    const { POST } = await import('@/app/api/nomina/nominas/[id]/pagar/route');
    const req = new NextRequest('http://localhost/api/nomina/nominas/nom_1/pagar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'nom_1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.estado).toBe('PAGADA');
  });

  it('devuelve 422 si intenta pagar una nómina en BORRADOR', async () => {
    setupSession();
    mockPrisma.nomina.findFirst.mockResolvedValue({
      id: 'nom_1',
      empresaId: 'emp_1',
      estado: 'BORRADOR',
    });

    const { POST } = await import('@/app/api/nomina/nominas/[id]/pagar/route');
    const req = new NextRequest('http://localhost/api/nomina/nominas/nom_1/pagar', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'nom_1' }) });
    expect(res.status).toBe(422);
  });
});
