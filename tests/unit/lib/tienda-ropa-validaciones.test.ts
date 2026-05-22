import { describe, it, expect } from 'vitest';
import {
  crearVarianteSchema,
  actualizarVarianteSchema,
  crearDevolucionSchema,
  actualizarDevolucionSchema,
} from '@/lib/validations/tienda-ropa';

const baseVariante = {
  productoId: 'clproducto0000000000000001',
};

describe('crearVarianteSchema', () => {
  it('acepta datos mínimos (solo productoId)', () => {
    const result = crearVarianteSchema.safeParse(baseVariante);
    expect(result.success).toBe(true);
  });

  it('acepta todos los campos opcionales', () => {
    const result = crearVarianteSchema.safeParse({
      ...baseVariante,
      talla: 'M',
      color: 'Azul marino',
      sku: 'CAM-AZUL-M',
      stock: 10,
      precio: 1500,
    });
    expect(result.success).toBe(true);
  });

  it('stock por defecto es 0', () => {
    const result = crearVarianteSchema.safeParse(baseVariante);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.stock).toBe(0);
  });

  it('rechaza productoId inválido', () => {
    const result = crearVarianteSchema.safeParse({ productoId: 'no-es-cuid' });
    expect(result.success).toBe(false);
  });

  it('rechaza precio de 0', () => {
    const result = crearVarianteSchema.safeParse({ ...baseVariante, precio: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza precio negativo', () => {
    const result = crearVarianteSchema.safeParse({ ...baseVariante, precio: -100 });
    expect(result.success).toBe(false);
  });

  it('rechaza talla de más de 20 caracteres', () => {
    const result = crearVarianteSchema.safeParse({
      ...baseVariante,
      talla: 'X'.repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it('convierte stock con coerce', () => {
    const result = crearVarianteSchema.safeParse({ ...baseVariante, stock: '5' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.stock).toBe(5);
  });

  it('rechaza stock negativo', () => {
    const result = crearVarianteSchema.safeParse({ ...baseVariante, stock: -1 });
    expect(result.success).toBe(false);
  });
});

describe('actualizarVarianteSchema', () => {
  it('acepta patch parcial vacío', () => {
    const result = actualizarVarianteSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('acepta activa false', () => {
    const result = actualizarVarianteSchema.safeParse({ activa: false });
    expect(result.success).toBe(true);
  });

  it('acepta precio null (quitar precio especial)', () => {
    const result = actualizarVarianteSchema.safeParse({ precio: null });
    expect(result.success).toBe(true);
  });

  it('rechaza precio negativo', () => {
    const result = actualizarVarianteSchema.safeParse({ precio: -1 });
    expect(result.success).toBe(false);
  });
});

const baseDevolucion = {
  facturaId: 'clfactura000000000000000001',
  motivo: 'Producto defectuoso',
};

describe('crearDevolucionSchema', () => {
  it('acepta datos mínimos requeridos', () => {
    const result = crearDevolucionSchema.safeParse(baseDevolucion);
    expect(result.success).toBe(true);
  });

  it('tipo por defecto es DEVOLUCION', () => {
    const result = crearDevolucionSchema.safeParse(baseDevolucion);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tipo).toBe('DEVOLUCION');
  });

  it('acepta tipo INTERCAMBIO', () => {
    const result = crearDevolucionSchema.safeParse({ ...baseDevolucion, tipo: 'INTERCAMBIO' });
    expect(result.success).toBe(true);
  });

  it('rechaza tipo inválido', () => {
    const result = crearDevolucionSchema.safeParse({ ...baseDevolucion, tipo: 'REGALO' });
    expect(result.success).toBe(false);
  });

  it('rechaza facturaId inválido', () => {
    const result = crearDevolucionSchema.safeParse({ ...baseDevolucion, facturaId: 'no-cuid' });
    expect(result.success).toBe(false);
  });

  it('rechaza motivo vacío', () => {
    const result = crearDevolucionSchema.safeParse({ ...baseDevolucion, motivo: '' });
    expect(result.success).toBe(false);
  });

  it('acepta montoCredito positivo', () => {
    const result = crearDevolucionSchema.safeParse({ ...baseDevolucion, montoCredito: 500 });
    expect(result.success).toBe(true);
  });

  it('rechaza montoCredito negativo', () => {
    const result = crearDevolucionSchema.safeParse({ ...baseDevolucion, montoCredito: -50 });
    expect(result.success).toBe(false);
  });
});

describe('actualizarDevolucionSchema', () => {
  it('acepta estado APROBADA', () => {
    const result = actualizarDevolucionSchema.safeParse({ estado: 'APROBADA' });
    expect(result.success).toBe(true);
  });

  it('acepta todos los estados válidos', () => {
    for (const estado of ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'COMPLETADA']) {
      const result = actualizarDevolucionSchema.safeParse({ estado });
      expect(result.success).toBe(true);
    }
  });

  it('rechaza estado inválido', () => {
    const result = actualizarDevolucionSchema.safeParse({ estado: 'OTRO' });
    expect(result.success).toBe(false);
  });

  it('requiere estado', () => {
    const result = actualizarDevolucionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
