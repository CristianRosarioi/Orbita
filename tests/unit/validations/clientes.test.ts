import { describe, it, expect } from 'vitest';
import { CreateClienteSchema, UpdateClienteSchema } from '@/lib/validations/clientes';
import { TipoCliente, TipoIdentificacion } from '@/types/enums';

const baseValido = {
  tipo: TipoCliente.PERSONA,
  tipoIdentificacion: TipoIdentificacion.CEDULA,
  nombre: 'Juan Pérez',
};

describe('CreateClienteSchema', () => {
  describe('campos obligatorios', () => {
    it('acepta datos mínimos válidos', () => {
      expect(CreateClienteSchema.safeParse(baseValido).success).toBe(true);
    });

    it('rechaza nombre con menos de 2 caracteres', () => {
      const r = CreateClienteSchema.safeParse({ ...baseValido, nombre: 'A' });
      expect(r.success).toBe(false);
    });

    it('rechaza nombre con más de 150 caracteres', () => {
      const r = CreateClienteSchema.safeParse({ ...baseValido, nombre: 'A'.repeat(151) });
      expect(r.success).toBe(false);
    });

    it('rechaza tipo inválido', () => {
      const r = CreateClienteSchema.safeParse({ ...baseValido, tipo: 'OTRO' });
      expect(r.success).toBe(false);
    });
  });

  describe('email', () => {
    it('acepta email válido', () => {
      const r = CreateClienteSchema.safeParse({ ...baseValido, email: 'juan@ejemplo.com' });
      expect(r.success).toBe(true);
    });

    it('acepta email vacío (string vacío)', () => {
      const r = CreateClienteSchema.safeParse({ ...baseValido, email: '' });
      expect(r.success).toBe(true);
    });

    it('rechaza email inválido', () => {
      const r = CreateClienteSchema.safeParse({ ...baseValido, email: 'no-es-email' });
      expect(r.success).toBe(false);
    });
  });

  describe('validación de identificación', () => {
    it('acepta cédula de 11 dígitos', () => {
      const r = CreateClienteSchema.safeParse({
        ...baseValido,
        tipoIdentificacion: TipoIdentificacion.CEDULA,
        identificacion: '00112345678',
      });
      expect(r.success).toBe(true);
    });

    it('rechaza cédula con menos de 11 dígitos', () => {
      const r = CreateClienteSchema.safeParse({
        ...baseValido,
        tipoIdentificacion: TipoIdentificacion.CEDULA,
        identificacion: '0011234567',
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        const paths = r.error.issues.map((i) => i.path);
        expect(paths.some((p) => p.includes('identificacion'))).toBe(true);
      }
    });

    it('acepta RNC de 9 dígitos', () => {
      const r = CreateClienteSchema.safeParse({
        ...baseValido,
        tipoIdentificacion: TipoIdentificacion.RNC,
        identificacion: '101765771',
      });
      expect(r.success).toBe(true);
    });

    it('rechaza RNC con más de 9 dígitos', () => {
      const r = CreateClienteSchema.safeParse({
        ...baseValido,
        tipoIdentificacion: TipoIdentificacion.RNC,
        identificacion: '1017657710',
      });
      expect(r.success).toBe(false);
    });

    it('acepta pasaporte alfanumérico de 6-15 caracteres', () => {
      const r = CreateClienteSchema.safeParse({
        ...baseValido,
        tipoIdentificacion: TipoIdentificacion.PASAPORTE,
        identificacion: 'AB123456',
      });
      expect(r.success).toBe(true);
    });

    it('rechaza pasaporte con menos de 6 caracteres', () => {
      const r = CreateClienteSchema.safeParse({
        ...baseValido,
        tipoIdentificacion: TipoIdentificacion.PASAPORTE,
        identificacion: 'AB12',
      });
      expect(r.success).toBe(false);
    });

    it('acepta sin identificación cuando tipoIdentificacion es SIN_IDENTIFICACION', () => {
      const r = CreateClienteSchema.safeParse({
        ...baseValido,
        tipoIdentificacion: TipoIdentificacion.SIN_IDENTIFICACION,
      });
      expect(r.success).toBe(true);
    });
  });

  describe('límite de crédito', () => {
    it('acepta límite de crédito positivo', () => {
      const r = CreateClienteSchema.safeParse({ ...baseValido, limiteCredito: 5000 });
      expect(r.success).toBe(true);
    });

    it('acepta límite de crédito cero', () => {
      const r = CreateClienteSchema.safeParse({ ...baseValido, limiteCredito: 0 });
      expect(r.success).toBe(true);
    });

    it('rechaza límite de crédito negativo', () => {
      const r = CreateClienteSchema.safeParse({ ...baseValido, limiteCredito: -1 });
      expect(r.success).toBe(false);
    });
  });
});

describe('UpdateClienteSchema', () => {
  it('acepta objeto vacío (todos los campos opcionales)', () => {
    expect(UpdateClienteSchema.safeParse({}).success).toBe(true);
  });

  it('acepta solo activo: false', () => {
    const r = UpdateClienteSchema.safeParse({ activo: false });
    expect(r.success).toBe(true);
  });

  it('acepta actualización de nombre', () => {
    const r = UpdateClienteSchema.safeParse({ nombre: 'Nuevo Nombre' });
    expect(r.success).toBe(true);
  });
});
