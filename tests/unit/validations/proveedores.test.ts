import { describe, it, expect } from 'vitest';
import { CreateProveedorSchema, UpdateProveedorSchema } from '@/lib/validations/proveedores';
import { TipoIdentificacion } from '@/types/enums';

const baseValido = {
  tipoIdentificacion: TipoIdentificacion.RNC,
  nombre: 'Distribuidora Caribe S.R.L.',
};

describe('CreateProveedorSchema', () => {
  describe('campos obligatorios', () => {
    it('acepta datos mínimos válidos', () => {
      expect(CreateProveedorSchema.safeParse(baseValido).success).toBe(true);
    });

    it('rechaza nombre con menos de 2 caracteres', () => {
      const r = CreateProveedorSchema.safeParse({ ...baseValido, nombre: 'A' });
      expect(r.success).toBe(false);
    });

    it('rechaza nombre con más de 150 caracteres', () => {
      const r = CreateProveedorSchema.safeParse({ ...baseValido, nombre: 'A'.repeat(151) });
      expect(r.success).toBe(false);
    });

    it('rechaza tipo de identificación inválido', () => {
      const r = CreateProveedorSchema.safeParse({ ...baseValido, tipoIdentificacion: 'NIF' });
      expect(r.success).toBe(false);
    });
  });

  describe('email', () => {
    it('acepta email válido', () => {
      const r = CreateProveedorSchema.safeParse({ ...baseValido, email: 'proveedor@ejemplo.com' });
      expect(r.success).toBe(true);
    });

    it('acepta email vacío (string vacío)', () => {
      const r = CreateProveedorSchema.safeParse({ ...baseValido, email: '' });
      expect(r.success).toBe(true);
    });

    it('rechaza email inválido', () => {
      const r = CreateProveedorSchema.safeParse({ ...baseValido, email: 'no-es-email' });
      expect(r.success).toBe(false);
    });
  });

  describe('días de crédito', () => {
    it('acepta días de crédito válidos', () => {
      const r = CreateProveedorSchema.safeParse({ ...baseValido, diasCredito: 30 });
      expect(r.success).toBe(true);
    });

    it('acepta días de crédito cero', () => {
      const r = CreateProveedorSchema.safeParse({ ...baseValido, diasCredito: 0 });
      expect(r.success).toBe(true);
    });

    it('rechaza días de crédito negativos', () => {
      const r = CreateProveedorSchema.safeParse({ ...baseValido, diasCredito: -1 });
      expect(r.success).toBe(false);
    });

    it('rechaza días de crédito decimales', () => {
      const r = CreateProveedorSchema.safeParse({ ...baseValido, diasCredito: 15.5 });
      expect(r.success).toBe(false);
    });
  });

  describe('tipos de identificación', () => {
    it('acepta RNC', () => {
      const r = CreateProveedorSchema.safeParse({
        ...baseValido,
        tipoIdentificacion: TipoIdentificacion.RNC,
      });
      expect(r.success).toBe(true);
    });

    it('acepta CEDULA', () => {
      const r = CreateProveedorSchema.safeParse({
        ...baseValido,
        tipoIdentificacion: TipoIdentificacion.CEDULA,
      });
      expect(r.success).toBe(true);
    });

    it('acepta PASAPORTE', () => {
      const r = CreateProveedorSchema.safeParse({
        ...baseValido,
        tipoIdentificacion: TipoIdentificacion.PASAPORTE,
      });
      expect(r.success).toBe(true);
    });

    it('acepta SIN_IDENTIFICACION', () => {
      const r = CreateProveedorSchema.safeParse({
        ...baseValido,
        tipoIdentificacion: TipoIdentificacion.SIN_IDENTIFICACION,
      });
      expect(r.success).toBe(true);
    });
  });
});

describe('UpdateProveedorSchema', () => {
  it('acepta objeto vacío (todos opcionales)', () => {
    expect(UpdateProveedorSchema.safeParse({}).success).toBe(true);
  });

  it('acepta actualización de nombre', () => {
    const r = UpdateProveedorSchema.safeParse({ nombre: 'Nuevo Proveedor' });
    expect(r.success).toBe(true);
  });

  it('acepta desactivar proveedor', () => {
    const r = UpdateProveedorSchema.safeParse({ activo: false });
    expect(r.success).toBe(true);
  });
});
