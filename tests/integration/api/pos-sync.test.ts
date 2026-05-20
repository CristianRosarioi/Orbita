import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}));

vi.mock('@/lib/auth', () => ({
  requireEmpresa: vi.fn().mockResolvedValue('emp_test_id'),
}));

vi.mock('@/lib/facturacion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/facturacion')>();
  return {
    ...actual,
    generarNumeroFactura: vi.fn().mockResolvedValue({
      numero: 'FAC-2026-0001',
      numeroInt: 1,
      anio: 2026,
    }),
  };
});

const mockFacturaCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    factura: {
      create: mockFacturaCreate,
    },
    $transaction: vi.fn((cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        factura: { create: mockFacturaCreate },
      }),
    ),
  },
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/pos/sync/bulk', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const ventaBase = {
  id: 'offline-1234567890-abc',
  items: [
    {
      productoId: 'prod_1',
      nombre: 'Pan de agua',
      cantidad: 3,
      precio: 10,
      itbis: 0,
      subtotal: 30,
      total: 30,
    },
  ],
  subtotal: 30,
  itbis: 0,
  total: 30,
  metodoPago: 'EFECTIVO',
  creadoEn: Date.now(),
};

// ─── POST /api/pos/sync/bulk ─────────────────────────────────────────────────

describe('POST /api/pos/sync/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFacturaCreate.mockResolvedValue({ id: 'fac_new', numero: 'FAC-2026-0001' });
  });

  it('rechaza body vacío con 400', async () => {
    const { POST } = await import('@/app/api/pos/sync/bulk/route');
    const req = new NextRequest('http://localhost/api/pos/sync/bulk', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('rechaza array ventas vacío con 400', async () => {
    const { POST } = await import('@/app/api/pos/sync/bulk/route');
    const res = await POST(makeReq({ ventas: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('convierte una venta offline a factura correctamente', async () => {
    const { POST } = await import('@/app/api/pos/sync/bulk/route');
    const res = await POST(makeReq({ ventas: [ventaBase] }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toContain('offline-1234567890-abc');
    expect(body.errores).toHaveLength(0);
    expect(mockFacturaCreate).toHaveBeenCalledOnce();
  });

  it('la factura creada tiene estado PAGADA', async () => {
    const { POST } = await import('@/app/api/pos/sync/bulk/route');
    await POST(makeReq({ ventas: [ventaBase] }));

    const callArg = mockFacturaCreate.mock.calls[0][0];
    expect(callArg.data.estado).toBe('PAGADA');
    expect(callArg.data.empresaId).toBe('emp_test_id');
  });

  it('incluye el ID local en las notas de la factura', async () => {
    const { POST } = await import('@/app/api/pos/sync/bulk/route');
    await POST(makeReq({ ventas: [ventaBase] }));

    const callArg = mockFacturaCreate.mock.calls[0][0];
    expect(callArg.data.notas).toContain('offline-1234567890-abc');
  });

  it('procesa múltiples ventas y devuelve ok por cada una', async () => {
    const venta2 = { ...ventaBase, id: 'offline-9999999999-xyz' };
    const { POST } = await import('@/app/api/pos/sync/bulk/route');
    const res = await POST(makeReq({ ventas: [ventaBase, venta2] }));

    const body = await res.json();
    expect(body.ok).toHaveLength(2);
    expect(body.errores).toHaveLength(0);
    expect(mockFacturaCreate).toHaveBeenCalledTimes(2);
  });

  it('reporta error individual sin fallar todo el batch', async () => {
    mockFacturaCreate
      .mockResolvedValueOnce({ id: 'fac_1' })
      .mockRejectedValueOnce(new Error('Constraint violation'));

    const venta2 = { ...ventaBase, id: 'offline-error-venta' };
    const { POST } = await import('@/app/api/pos/sync/bulk/route');
    const res = await POST(makeReq({ ventas: [ventaBase, venta2] }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toContain('offline-1234567890-abc');
    expect(body.errores).toHaveLength(1);
    expect(body.errores[0].id).toBe('offline-error-venta');
    expect(body.errores[0].error).toBe('Constraint violation');
  });

  it('acepta venta con clienteId y clienteNombre opcionales', async () => {
    const ventaConCliente = {
      ...ventaBase,
      id: 'offline-con-cliente',
      clienteId: 'cli_123',
      clienteNombre: 'María López',
    };

    const { POST } = await import('@/app/api/pos/sync/bulk/route');
    const res = await POST(makeReq({ ventas: [ventaConCliente] }));

    const body = await res.json();
    expect(body.ok).toContain('offline-con-cliente');

    const callArg = mockFacturaCreate.mock.calls[0][0];
    expect(callArg.data.clienteId).toBe('cli_123');
    expect(callArg.data.clienteNombre).toBe('María López');
  });

  it('usa "Cliente POS Offline" cuando no hay clienteNombre', async () => {
    const { POST } = await import('@/app/api/pos/sync/bulk/route');
    await POST(makeReq({ ventas: [ventaBase] }));

    const callArg = mockFacturaCreate.mock.calls[0][0];
    expect(callArg.data.clienteNombre).toBe('Cliente POS Offline');
  });

  it('retorna 401 si no hay sesión', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ userId: null });

    const { POST } = await import('@/app/api/pos/sync/bulk/route');
    const res = await POST(makeReq({ ventas: [ventaBase] }));
    expect(res.status).toBe(401);
  });
});
