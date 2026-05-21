import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}));

vi.mock('@/lib/auth', () => ({
  requireEmpresa: vi.fn().mockResolvedValue('emp_test_id'),
}));

const mockPrisma = {
  propiedad: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  contratoAlquiler: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  pagoAlquiler: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  $transaction: vi.fn((cb: (tx: unknown) => Promise<unknown>) => cb(mockPrisma)),
};

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

function makeReq(url: string, body?: unknown) {
  if (!body) return new NextRequest(`http://localhost${url}`);
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── GET /api/inmobiliaria/propiedades ───────────────────────────────────────

describe('GET /api/inmobiliaria/propiedades', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve lista paginada', async () => {
    mockPrisma.propiedad.findMany.mockResolvedValue([
      {
        id: 'p1',
        codigo: 'REF-001',
        nombre: 'Apto 2B',
        tipo: 'APARTAMENTO',
        estado: 'DISPONIBLE',
        ciudad: 'Santo Domingo',
        _count: { contratos: 0 },
      },
    ]);
    mockPrisma.propiedad.count.mockResolvedValue(1);

    const { GET } = await import('@/app/api/inmobiliaria/propiedades/route');
    const res = await GET(new NextRequest('http://localhost/api/inmobiliaria/propiedades'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });
});

// ─── POST /api/inmobiliaria/propiedades ──────────────────────────────────────

describe('POST /api/inmobiliaria/propiedades', () => {
  beforeEach(() => vi.clearAllMocks());

  const propiedadValida = {
    codigo: 'REF-001',
    nombre: 'Apto 2B Torre Este',
    tipo: 'APARTAMENTO',
    direccion: 'Calle 30 de Marzo #45',
  };

  it('crea propiedad con datos válidos', async () => {
    mockPrisma.propiedad.findUnique.mockResolvedValue(null);
    mockPrisma.propiedad.create.mockResolvedValue({ id: 'p1', ...propiedadValida });

    const { POST } = await import('@/app/api/inmobiliaria/propiedades/route');
    const res = await POST(makeReq('/api/inmobiliaria/propiedades', propiedadValida));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('rechaza código duplicado con 409', async () => {
    mockPrisma.propiedad.findUnique.mockResolvedValue({ id: 'existing' });

    const { POST } = await import('@/app/api/inmobiliaria/propiedades/route');
    const res = await POST(makeReq('/api/inmobiliaria/propiedades', propiedadValida));
    expect(res.status).toBe(409);
  });

  it('rechaza tipo inválido con 422', async () => {
    const { POST } = await import('@/app/api/inmobiliaria/propiedades/route');
    const res = await POST(
      makeReq('/api/inmobiliaria/propiedades', { ...propiedadValida, tipo: 'IGLESIA' }),
    );
    expect(res.status).toBe(422);
  });
});

// ─── POST /api/inmobiliaria/contratos ───────────────────────────────────────

describe('POST /api/inmobiliaria/contratos', () => {
  beforeEach(() => vi.clearAllMocks());

  const contratoValido = {
    propiedadId: 'prop_1',
    inquilinoNombre: 'Juan Pérez',
    montoMensual: 25000,
    fechaInicio: '2026-01-01',
    fechaFin: '2027-01-01',
  };

  it('no permite crear contrato en propiedad ALQUILADA', async () => {
    mockPrisma.propiedad.findFirst.mockResolvedValue({
      id: 'prop_1',
      estado: 'ALQUILADA',
      deletedAt: null,
    });

    const { POST } = await import('@/app/api/inmobiliaria/contratos/route');
    const res = await POST(makeReq('/api/inmobiliaria/contratos', contratoValido));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe('CONFLICT');
  });

  it('cambia estado de propiedad a ALQUILADA al crear contrato', async () => {
    mockPrisma.propiedad.findFirst.mockResolvedValue({
      id: 'prop_1',
      estado: 'DISPONIBLE',
      deletedAt: null,
    });
    const mockTxContrato = {
      contratoAlquiler: {
        create: vi
          .fn()
          .mockResolvedValue({
            id: 'c1',
            ...contratoValido,
            propiedad: { codigo: 'REF-001', nombre: 'Apto' },
          }),
      },
    };
    const mockTxPropiedad = { propiedad: { update: vi.fn() } };
    const mockTx = { ...mockTxContrato, ...mockTxPropiedad };
    mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) =>
      cb(mockTx),
    );

    const { POST } = await import('@/app/api/inmobiliaria/contratos/route');
    const res = await POST(makeReq('/api/inmobiliaria/contratos', contratoValido));
    expect(res.status).toBe(201);
    expect(mockTxPropiedad.propiedad.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: 'ALQUILADA' }) }),
    );
  });
});

// ─── POST /api/inmobiliaria/contratos/[id]/pagos ─────────────────────────────

describe('POST /api/inmobiliaria/contratos/[id]/pagos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza pago duplicado para el mismo mes', async () => {
    mockPrisma.contratoAlquiler.findFirst.mockResolvedValue({
      id: 'c1',
      empresaId: 'emp_test_id',
      montoMensual: 25000,
    });
    mockPrisma.pagoAlquiler.findUnique.mockResolvedValue({ id: 'pago_1', estado: 'PAGADO' });

    const { POST } = await import('@/app/api/inmobiliaria/contratos/[id]/pagos/route');
    const req = new NextRequest('http://localhost/api/inmobiliaria/contratos/c1/pagos', {
      method: 'POST',
      body: JSON.stringify({ mes: '2026-05', monto: 25000 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe('CONFLICT');
  });

  it('registra pago correctamente', async () => {
    mockPrisma.contratoAlquiler.findFirst.mockResolvedValue({ id: 'c1', empresaId: 'emp_test_id' });
    mockPrisma.pagoAlquiler.findUnique.mockResolvedValue(null);
    mockPrisma.pagoAlquiler.upsert.mockResolvedValue({
      id: 'pago_1',
      mes: '2026-05',
      monto: 25000,
      estado: 'PAGADO',
      pagadoEn: new Date(),
    });

    const { POST } = await import('@/app/api/inmobiliaria/contratos/[id]/pagos/route');
    const req = new NextRequest('http://localhost/api/inmobiliaria/contratos/c1/pagos', {
      method: 'POST',
      body: JSON.stringify({ mes: '2026-05', monto: 25000 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.estado).toBe('PAGADO');
  });
});
