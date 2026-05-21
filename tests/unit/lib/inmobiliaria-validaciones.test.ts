import { describe, it, expect } from 'vitest';
import {
  CrearPropiedadSchema,
  CrearContratoSchema,
  RegistrarPagoSchema,
} from '@/lib/validations/inmobiliaria';

// ─── CrearPropiedadSchema ────────────────────────────────────────────────────

describe('CrearPropiedadSchema', () => {
  const base = {
    codigo: 'REF-001',
    nombre: 'Apto 2B Torre Este',
    tipo: 'APARTAMENTO',
    direccion: 'Calle 30 de Marzo #45',
  };

  it('acepta datos mínimos válidos', () => {
    const result = CrearPropiedadSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('falla si código está vacío', () => {
    const result = CrearPropiedadSchema.safeParse({ ...base, codigo: '' });
    expect(result.success).toBe(false);
  });

  it('falla si el tipo no es válido', () => {
    const result = CrearPropiedadSchema.safeParse({ ...base, tipo: 'IGLESIA' });
    expect(result.success).toBe(false);
  });

  it('acepta todos los tipos válidos', () => {
    const tipos = [
      'APARTAMENTO',
      'CASA',
      'LOCAL_COMERCIAL',
      'OFICINA',
      'TERRENO',
      'NAVE_INDUSTRIAL',
    ];
    for (const tipo of tipos) {
      expect(CrearPropiedadSchema.safeParse({ ...base, tipo }).success).toBe(true);
    }
  });

  it('usa "Santo Domingo" como ciudad por defecto', () => {
    const result = CrearPropiedadSchema.safeParse(base);
    expect(result.success && result.data.ciudad).toBe('Santo Domingo');
  });

  it('acepta precios positivos opcionales', () => {
    const result = CrearPropiedadSchema.safeParse({
      ...base,
      precioAlquiler: 25000,
      precioVenta: 4500000,
    });
    expect(result.success).toBe(true);
  });
});

// ─── CrearContratoSchema ─────────────────────────────────────────────────────

describe('CrearContratoSchema', () => {
  const base = {
    propiedadId: 'prop_abc123',
    inquilinoNombre: 'Juan Pérez',
    montoMensual: 25000,
    deposito: 50000,
    fechaInicio: '2026-01-01',
    fechaFin: '2027-01-01',
  };

  it('acepta contrato válido', () => {
    const result = CrearContratoSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('falla si el nombre del inquilino está vacío', () => {
    const result = CrearContratoSchema.safeParse({ ...base, inquilinoNombre: '' });
    expect(result.success).toBe(false);
  });

  it('falla si el monto mensual es 0', () => {
    const result = CrearContratoSchema.safeParse({ ...base, montoMensual: 0 });
    expect(result.success).toBe(false);
  });

  it('falla si la fecha de fin es anterior a la fecha de inicio', () => {
    const result = CrearContratoSchema.safeParse({
      ...base,
      fechaInicio: '2027-01-01',
      fechaFin: '2026-01-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('posterior');
    }
  });

  it('deposito es 0 por defecto', () => {
    const { deposito: _, ...sinDeposito } = base;
    const result = CrearContratoSchema.safeParse(sinDeposito);
    expect(result.success && result.data.deposito).toBe(0);
  });
});

// ─── RegistrarPagoSchema ─────────────────────────────────────────────────────

describe('RegistrarPagoSchema', () => {
  it('acepta mes en formato YYYY-MM', () => {
    const result = RegistrarPagoSchema.safeParse({ mes: '2026-05', monto: 25000 });
    expect(result.success).toBe(true);
  });

  it('falla si el formato de mes es incorrecto', () => {
    expect(RegistrarPagoSchema.safeParse({ mes: '05-2026', monto: 25000 }).success).toBe(false);
    expect(RegistrarPagoSchema.safeParse({ mes: '2026/05', monto: 25000 }).success).toBe(false);
    expect(RegistrarPagoSchema.safeParse({ mes: '2026-5', monto: 25000 }).success).toBe(false);
  });

  it('falla si el monto es 0', () => {
    const result = RegistrarPagoSchema.safeParse({ mes: '2026-05', monto: 0 });
    expect(result.success).toBe(false);
  });

  it('falla si el monto es negativo', () => {
    const result = RegistrarPagoSchema.safeParse({ mes: '2026-05', monto: -100 });
    expect(result.success).toBe(false);
  });
});
