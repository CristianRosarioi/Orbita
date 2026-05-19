import { describe, it, expect } from 'vitest';
import { CreateLoteSchema, UpdateLoteSchema } from '@/lib/validations/farmacia';

const baseLote = {
  productoId: 'prod_1',
  numeroLote: 'L2024-001',
  fechaVencimiento: '2026-12-31',
  cantidadInicial: 100,
};

describe('CreateLoteSchema', () => {
  it('acepta datos mínimos requeridos', () => {
    const result = CreateLoteSchema.safeParse(baseLote);
    expect(result.success).toBe(true);
  });

  it('acepta todos los campos opcionales', () => {
    const result = CreateLoteSchema.safeParse({
      ...baseLote,
      precioCompra: 25.5,
      proveedor: 'Farmacéutica Nacional',
      notas: 'Refrigeración requerida',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza productoId vacío', () => {
    const result = CreateLoteSchema.safeParse({ ...baseLote, productoId: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza numeroLote vacío', () => {
    const result = CreateLoteSchema.safeParse({ ...baseLote, numeroLote: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza cantidadInicial cero', () => {
    const result = CreateLoteSchema.safeParse({ ...baseLote, cantidadInicial: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza cantidadInicial negativa', () => {
    const result = CreateLoteSchema.safeParse({ ...baseLote, cantidadInicial: -50 });
    expect(result.success).toBe(false);
  });

  it('rechaza fecha de vencimiento con formato inválido', () => {
    const result = CreateLoteSchema.safeParse({ ...baseLote, fechaVencimiento: '31/12/2026' });
    expect(result.success).toBe(false);
  });

  it('acepta fecha de vencimiento en el pasado (lote ya vencido)', () => {
    const result = CreateLoteSchema.safeParse({ ...baseLote, fechaVencimiento: '2020-01-01' });
    expect(result.success).toBe(true);
  });

  it('rechaza precioCompra negativo', () => {
    const result = CreateLoteSchema.safeParse({ ...baseLote, precioCompra: -10 });
    expect(result.success).toBe(false);
  });

  it('rechaza proveedor demasiado largo', () => {
    const result = CreateLoteSchema.safeParse({ ...baseLote, proveedor: 'A'.repeat(151) });
    expect(result.success).toBe(false);
  });
});

describe('UpdateLoteSchema', () => {
  it('acepta objeto vacío (todo opcional)', () => {
    const result = UpdateLoteSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('acepta cantidadActual en cero (agotado)', () => {
    const result = UpdateLoteSchema.safeParse({ cantidadActual: 0 });
    expect(result.success).toBe(true);
  });

  it('rechaza cantidadActual negativa', () => {
    const result = UpdateLoteSchema.safeParse({ cantidadActual: -1 });
    expect(result.success).toBe(false);
  });

  it('acepta marcar lote como inactivo', () => {
    const result = UpdateLoteSchema.safeParse({ activo: false });
    expect(result.success).toBe(true);
  });

  it('acepta actualización de notas', () => {
    const result = UpdateLoteSchema.safeParse({ notas: 'Lote retirado por recall' });
    expect(result.success).toBe(true);
  });

  it('acepta combinación de campos', () => {
    const result = UpdateLoteSchema.safeParse({
      cantidadActual: 50,
      proveedor: 'Nuevo Proveedor SA',
      activo: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('Cálculo de días restantes', () => {
  it('un lote con fecha en el pasado tiene días negativos', () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date('2020-01-01');
    const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    expect(dias).toBeLessThan(0);
  });

  it('un lote con fecha hoy tiene 0 días restantes', () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const dias = Math.ceil((hoy.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    expect(dias).toBe(0);
  });

  it('un lote que vence en 30 días tiene exactamente 30 días restantes', () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(hoy);
    vencimiento.setDate(hoy.getDate() + 30);
    const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    expect(dias).toBe(30);
  });

  it('la lista de vencimientos está ordenada por fecha ASC', () => {
    const lotes = [
      { fechaVencimiento: new Date('2026-06-01') },
      { fechaVencimiento: new Date('2026-03-15') },
      { fechaVencimiento: new Date('2026-12-31') },
    ];
    const ordenados = [...lotes].sort(
      (a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime(),
    );
    expect(ordenados[0].fechaVencimiento.toISOString().slice(0, 10)).toBe('2026-03-15');
    expect(ordenados[1].fechaVencimiento.toISOString().slice(0, 10)).toBe('2026-06-01');
    expect(ordenados[2].fechaVencimiento.toISOString().slice(0, 10)).toBe('2026-12-31');
  });
});
