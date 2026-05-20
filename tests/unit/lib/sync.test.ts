import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock IndexedDB / Dexie before importing sync
vi.mock('@/lib/db-local', () => ({
  db: {
    productos: {
      bulkPut: vi.fn().mockResolvedValue(undefined),
      count: vi.fn().mockResolvedValue(0),
    },
    clientes: {
      bulkPut: vi.fn().mockResolvedValue(undefined),
      count: vi.fn().mockResolvedValue(0),
    },
    ventasOffline: {
      where: vi.fn(),
      update: vi.fn().mockResolvedValue(1),
      add: vi.fn().mockResolvedValue('local-id'),
    },
  },
}));

import { db } from '@/lib/db-local';
import {
  sincronizarProductos,
  sincronizarClientes,
  sincronizarVentasPendientes,
  guardarVentaOffline,
  generarIdLocal,
} from '@/lib/sync';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── sincronizarProductos ────────────────────────────────────────────────────

describe('sincronizarProductos', () => {
  it('descarga productos y los guarda en IndexedDB', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          { id: 'p1', nombre: 'Yogur', precioVenta: 50, stockActual: 20, itbisAplicable: true, activo: true },
          { id: 'p2', nombre: 'Leche', precioVenta: 35, stockActual: 10, itbisAplicable: false, activo: true },
        ],
      }),
    });

    const count = await sincronizarProductos('emp_1');
    expect(count).toBe(2);
    expect(mockDb.productos.bulkPut).toHaveBeenCalledOnce();
    const items = mockDb.productos.bulkPut.mock.calls[0][0];
    expect(items[0].empresaId).toBe('emp_1');
    expect(items[0].itbis).toBe(18);
    expect(items[1].itbis).toBe(0);
  });

  it('lanza error si la respuesta HTTP falla', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(sincronizarProductos('emp_1')).rejects.toThrow('Error al descargar productos');
  });

  it('guarda syncedAt como timestamp numérico', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [{ id: 'p1', nombre: 'Pan', precioVenta: 10, stockActual: 5, itbisAplicable: false, activo: true }],
      }),
    });
    await sincronizarProductos('emp_1');
    const items = mockDb.productos.bulkPut.mock.calls[0][0];
    expect(typeof items[0].syncedAt).toBe('number');
    expect(items[0].syncedAt).toBeGreaterThan(0);
  });
});

// ─── sincronizarClientes ─────────────────────────────────────────────────────

describe('sincronizarClientes', () => {
  it('descarga clientes y los guarda en IndexedDB', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          { id: 'c1', nombre: 'Juan Pérez', email: 'juan@test.com' },
          { id: 'c2', nombre: 'María López', telefono: '8091234567' },
        ],
      }),
    });

    const count = await sincronizarClientes('emp_1');
    expect(count).toBe(2);
    expect(mockDb.clientes.bulkPut).toHaveBeenCalledOnce();
    const items = mockDb.clientes.bulkPut.mock.calls[0][0];
    expect(items[0].empresaId).toBe('emp_1');
    expect(items[0].nombre).toBe('Juan Pérez');
  });

  it('acepta respuesta con propiedad items en lugar de data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        items: [{ id: 'c1', nombre: 'Pedro' }],
      }),
    });

    const count = await sincronizarClientes('emp_1');
    expect(count).toBe(1);
  });
});

// ─── sincronizarVentasPendientes ─────────────────────────────────────────────

describe('sincronizarVentasPendientes', () => {
  const ventasMock = [
    {
      id: 'offline-1',
      empresaId: 'emp_1',
      items: [{ productoId: 'p1', nombre: 'Pan', cantidad: 2, precio: 10, itbis: 0, subtotal: 20, total: 20 }],
      subtotal: 20,
      itbis: 0,
      total: 20,
      metodoPago: 'EFECTIVO',
      estado: 'PENDIENTE_SYNC' as const,
      creadoEn: Date.now(),
    },
  ];

  beforeEach(() => {
    const mockEquals = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(ventasMock) });
    mockDb.ventasOffline.where = vi.fn().mockReturnValue({ equals: mockEquals });
  });

  it('envía ventas pendientes y actualiza estado a SINCRONIZADA', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: ['offline-1'], errores: [] }),
    });

    const resultado = await sincronizarVentasPendientes();
    expect(resultado.ok).toBe(1);
    expect(resultado.errores).toBe(0);
    expect(mockDb.ventasOffline.update).toHaveBeenCalledWith('offline-1', expect.objectContaining({ estado: 'SINCRONIZADA' }));
  });

  it('marca como ERROR_SYNC cuando el servidor responde con error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: [], errores: [{ id: 'offline-1', error: 'Producto no encontrado' }] }),
    });

    const resultado = await sincronizarVentasPendientes();
    expect(resultado.errores).toBe(1);
    expect(mockDb.ventasOffline.update).toHaveBeenCalledWith(
      'offline-1',
      expect.objectContaining({ estado: 'ERROR_SYNC', errorMsg: 'Producto no encontrado' }),
    );
  });

  it('marca como ERROR_SYNC si el fetch falla (sin red)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    const resultado = await sincronizarVentasPendientes();
    expect(resultado.errores).toBe(1);
    expect(mockDb.ventasOffline.update).toHaveBeenCalledWith(
      'offline-1',
      expect.objectContaining({ estado: 'ERROR_SYNC' }),
    );
  });

  it('retorna {ok:0, errores:0} si no hay ventas pendientes', async () => {
    const mockEquals = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });
    mockDb.ventasOffline.where = vi.fn().mockReturnValue({ equals: mockEquals });

    const resultado = await sincronizarVentasPendientes();
    expect(resultado.ok).toBe(0);
    expect(resultado.errores).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ─── guardarVentaOffline ─────────────────────────────────────────────────────

describe('guardarVentaOffline', () => {
  it('guarda venta con estado PENDIENTE_SYNC y timestamp', async () => {
    const id = await guardarVentaOffline({
      empresaId: 'emp_1',
      items: [],
      subtotal: 0,
      itbis: 0,
      total: 100,
      metodoPago: 'EFECTIVO',
    });

    expect(typeof id).toBe('string');
    expect(mockDb.ventasOffline.add).toHaveBeenCalledOnce();
    const arg = mockDb.ventasOffline.add.mock.calls[0][0];
    expect(arg.estado).toBe('PENDIENTE_SYNC');
    expect(typeof arg.creadoEn).toBe('number');
  });
});

// ─── generarIdLocal ──────────────────────────────────────────────────────────

describe('generarIdLocal', () => {
  it('genera IDs únicos con prefijo offline-', () => {
    const id1 = generarIdLocal();
    const id2 = generarIdLocal();
    expect(id1.startsWith('offline-')).toBe(true);
    expect(id1).not.toBe(id2);
  });
});
