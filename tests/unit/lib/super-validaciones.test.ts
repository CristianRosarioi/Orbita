import { describe, it, expect } from 'vitest';
import {
  CreateDepartamentoSchema,
  UpdateDepartamentoSchema,
  CreateOfertaSchema,
  UpdateOfertaSchema,
  CreatePrecioVolumenSchema,
  UpdatePrecioVolumenSchema,
} from '@/lib/validations/super';

const ISO = (d: string) => new Date(d).toISOString();

describe('CreateDepartamentoSchema', () => {
  it('acepta nombre válido', () => {
    expect(CreateDepartamentoSchema.safeParse({ nombre: 'Lácteos' }).success).toBe(true);
  });

  it('acepta nombre con descripción', () => {
    const r = CreateDepartamentoSchema.safeParse({
      nombre: 'Bebidas',
      descripcion: 'Refrescos y jugos',
    });
    expect(r.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    expect(CreateDepartamentoSchema.safeParse({ nombre: '' }).success).toBe(false);
  });

  it('rechaza nombre mayor a 100 caracteres', () => {
    expect(CreateDepartamentoSchema.safeParse({ nombre: 'a'.repeat(101) }).success).toBe(false);
  });

  it('rechaza descripción mayor a 500 caracteres', () => {
    expect(
      CreateDepartamentoSchema.safeParse({ nombre: 'X', descripcion: 'a'.repeat(501) }).success,
    ).toBe(false);
  });
});

describe('UpdateDepartamentoSchema', () => {
  it('acepta objeto vacío (todos opcionales)', () => {
    expect(UpdateDepartamentoSchema.safeParse({}).success).toBe(true);
  });

  it('acepta solo activo', () => {
    expect(UpdateDepartamentoSchema.safeParse({ activo: false }).success).toBe(true);
  });

  it('acepta nombre parcial', () => {
    expect(UpdateDepartamentoSchema.safeParse({ nombre: 'Carnes' }).success).toBe(true);
  });
});

describe('CreateOfertaSchema', () => {
  const base = {
    productoId: 'prod-123',
    nombre: 'Oferta de verano',
    precioOriginal: 100,
    precioOferta: 80,
    fechaInicio: ISO('2030-01-01T08:00:00Z'),
    fechaFin: ISO('2030-01-15T08:00:00Z'),
  };

  it('acepta datos válidos completos', () => {
    expect(CreateOfertaSchema.safeParse(base).success).toBe(true);
  });

  it('acepta categoriaId opcional', () => {
    expect(CreateOfertaSchema.safeParse({ ...base, categoriaId: 'cat-1' }).success).toBe(true);
  });

  it('rechaza precioOferta >= precioOriginal', () => {
    const r = CreateOfertaSchema.safeParse({ ...base, precioOferta: 100 });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('precioOferta');
    }
  });

  it('rechaza precioOferta mayor que precioOriginal', () => {
    const r = CreateOfertaSchema.safeParse({ ...base, precioOferta: 120 });
    expect(r.success).toBe(false);
  });

  it('rechaza fechaFin anterior a fechaInicio', () => {
    const r = CreateOfertaSchema.safeParse({
      ...base,
      fechaInicio: ISO('2030-01-15T00:00:00Z'),
      fechaFin: ISO('2030-01-01T00:00:00Z'),
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('fechaFin');
    }
  });

  it('rechaza fechaFin igual a fechaInicio', () => {
    const misma = ISO('2030-06-01T00:00:00Z');
    expect(CreateOfertaSchema.safeParse({ ...base, fechaInicio: misma, fechaFin: misma }).success).toBe(false);
  });

  it('rechaza precioOriginal negativo', () => {
    expect(CreateOfertaSchema.safeParse({ ...base, precioOriginal: -10 }).success).toBe(false);
  });

  it('rechaza precioOferta cero', () => {
    expect(CreateOfertaSchema.safeParse({ ...base, precioOferta: 0 }).success).toBe(false);
  });

  it('rechaza nombre vacío', () => {
    expect(CreateOfertaSchema.safeParse({ ...base, nombre: '' }).success).toBe(false);
  });

  it('rechaza sin productoId', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { productoId: _pid, ...sin } = base;
    expect(CreateOfertaSchema.safeParse(sin).success).toBe(false);
  });

  it('coerce string a número en precios', () => {
    const r = CreateOfertaSchema.safeParse({ ...base, precioOriginal: '100', precioOferta: '75' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.precioOriginal).toBe(100);
      expect(r.data.precioOferta).toBe(75);
    }
  });
});

describe('UpdateOfertaSchema', () => {
  it('acepta objeto vacío', () => {
    expect(UpdateOfertaSchema.safeParse({}).success).toBe(true);
  });

  it('acepta solo activa', () => {
    expect(UpdateOfertaSchema.safeParse({ activa: false }).success).toBe(true);
  });

  it('acepta precioOferta positivo', () => {
    expect(UpdateOfertaSchema.safeParse({ precioOferta: 50 }).success).toBe(true);
  });

  it('rechaza precioOferta negativo', () => {
    expect(UpdateOfertaSchema.safeParse({ precioOferta: -5 }).success).toBe(false);
  });
});

describe('CreatePrecioVolumenSchema', () => {
  const base = { productoId: 'prod-1', cantidadMin: 6, precio: 45 };

  it('acepta datos mínimos válidos', () => {
    expect(CreatePrecioVolumenSchema.safeParse(base).success).toBe(true);
  });

  it('acepta con etiqueta', () => {
    expect(CreatePrecioVolumenSchema.safeParse({ ...base, etiqueta: 'Precio mayorista' }).success).toBe(true);
  });

  it('rechaza cantidadMin cero', () => {
    expect(CreatePrecioVolumenSchema.safeParse({ ...base, cantidadMin: 0 }).success).toBe(false);
  });

  it('rechaza cantidadMin negativa', () => {
    expect(CreatePrecioVolumenSchema.safeParse({ ...base, cantidadMin: -1 }).success).toBe(false);
  });

  it('rechaza precio cero', () => {
    expect(CreatePrecioVolumenSchema.safeParse({ ...base, precio: 0 }).success).toBe(false);
  });

  it('rechaza precio negativo', () => {
    expect(CreatePrecioVolumenSchema.safeParse({ ...base, precio: -10 }).success).toBe(false);
  });

  it('rechaza sin productoId', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { productoId: _pid, ...sin } = base;
    expect(CreatePrecioVolumenSchema.safeParse(sin).success).toBe(false);
  });

  it('rechaza etiqueta mayor a 50 caracteres', () => {
    expect(
      CreatePrecioVolumenSchema.safeParse({ ...base, etiqueta: 'a'.repeat(51) }).success,
    ).toBe(false);
  });

  it('coerce cantidadMin de string a número', () => {
    const r = CreatePrecioVolumenSchema.safeParse({ ...base, cantidadMin: '12' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.cantidadMin).toBe(12);
  });
});

describe('UpdatePrecioVolumenSchema', () => {
  it('acepta objeto vacío', () => {
    expect(UpdatePrecioVolumenSchema.safeParse({}).success).toBe(true);
  });

  it('acepta activo false', () => {
    expect(UpdatePrecioVolumenSchema.safeParse({ activo: false }).success).toBe(true);
  });

  it('acepta solo precio', () => {
    expect(UpdatePrecioVolumenSchema.safeParse({ precio: 38.5 }).success).toBe(true);
  });

  it('rechaza precio negativo', () => {
    expect(UpdatePrecioVolumenSchema.safeParse({ precio: -1 }).success).toBe(false);
  });
});
