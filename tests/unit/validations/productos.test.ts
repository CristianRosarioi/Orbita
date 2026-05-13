import { describe, it, expect } from 'vitest';
import { CreateProductoSchema, UpdateProductoSchema } from '@/lib/validations/productos';
import { TipoProducto } from '@/types/enums';

const baseValido = {
  tipo: TipoProducto.BIEN,
  nombre: 'Agua Mineral 500ml',
  unidadMedidaId: 'cm9abc123def456ghi789jkl01',
  precioVenta: 35,
  itbisAplicable: true,
  itbisIncluidoEnPrecio: false,
};

describe('CreateProductoSchema', () => {
  describe('campos obligatorios', () => {
    it('acepta datos mínimos válidos (BIEN)', () => {
      expect(CreateProductoSchema.safeParse(baseValido).success).toBe(true);
    });

    it('acepta servicio sin stock', () => {
      const r = CreateProductoSchema.safeParse({
        ...baseValido,
        tipo: TipoProducto.SERVICIO,
        stockActual: 0,
      });
      expect(r.success).toBe(true);
    });

    it('rechaza servicio con stock mayor a cero', () => {
      const r = CreateProductoSchema.safeParse({
        ...baseValido,
        tipo: TipoProducto.SERVICIO,
        stockActual: 10,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.includes('stockActual'))).toBe(true);
      }
    });

    it('rechaza nombre con menos de 2 caracteres', () => {
      const r = CreateProductoSchema.safeParse({ ...baseValido, nombre: 'A' });
      expect(r.success).toBe(false);
    });

    it('rechaza precio de venta negativo', () => {
      const r = CreateProductoSchema.safeParse({ ...baseValido, precioVenta: -1 });
      expect(r.success).toBe(false);
    });

    it('acepta precio de venta cero', () => {
      const r = CreateProductoSchema.safeParse({ ...baseValido, precioVenta: 0 });
      expect(r.success).toBe(true);
    });

    it('rechaza tipo inválido', () => {
      const r = CreateProductoSchema.safeParse({ ...baseValido, tipo: 'FISICO' });
      expect(r.success).toBe(false);
    });
  });

  describe('precios por nivel', () => {
    it('acepta precios adicionales opcionales', () => {
      const r = CreateProductoSchema.safeParse({
        ...baseValido,
        precioCredito: 38,
        precioMayorista: 32,
        precioEspecial: 30,
      });
      expect(r.success).toBe(true);
    });

    it('acepta sin precios adicionales', () => {
      const r = CreateProductoSchema.safeParse(baseValido);
      expect(r.success).toBe(true);
    });

    it('rechaza precio adicional negativo', () => {
      const r = CreateProductoSchema.safeParse({ ...baseValido, precioCredito: -5 });
      expect(r.success).toBe(false);
    });
  });

  describe('campos opcionales', () => {
    it('acepta SKU y código de barras', () => {
      const r = CreateProductoSchema.safeParse({
        ...baseValido,
        sku: 'PRD-001',
        codigoBarras: '7896543210987',
      });
      expect(r.success).toBe(true);
    });

    it('acepta categoriaId nulo (sin categoría)', () => {
      const r = CreateProductoSchema.safeParse({ ...baseValido, categoriaId: null });
      expect(r.success).toBe(true);
    });

    it('rechaza URL de imagen inválida', () => {
      const r = CreateProductoSchema.safeParse({ ...baseValido, imagenUrl: 'no-es-url' });
      expect(r.success).toBe(false);
    });

    it('acepta imagenUrl vacía (string vacío)', () => {
      const r = CreateProductoSchema.safeParse({ ...baseValido, imagenUrl: '' });
      expect(r.success).toBe(true);
    });
  });
});

describe('UpdateProductoSchema', () => {
  it('acepta objeto vacío (todos opcionales)', () => {
    expect(UpdateProductoSchema.safeParse({}).success).toBe(true);
  });

  it('acepta actualización de precio', () => {
    const r = UpdateProductoSchema.safeParse({ precioVenta: 40 });
    expect(r.success).toBe(true);
  });

  it('acepta desactivar producto', () => {
    const r = UpdateProductoSchema.safeParse({ activo: false });
    expect(r.success).toBe(true);
  });
});
