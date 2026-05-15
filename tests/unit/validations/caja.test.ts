import { describe, it, expect } from 'vitest';
import { AbrirCajaSchema, CerrarCajaSchema } from '@/lib/validations/caja';

describe('AbrirCajaSchema', () => {
  it('acepta monto de apertura de 0', () => {
    const result = AbrirCajaSchema.safeParse({ montoApertura: 0 });
    expect(result.success).toBe(true);
  });

  it('acepta monto positivo', () => {
    const result = AbrirCajaSchema.safeParse({ montoApertura: 5000 });
    expect(result.success).toBe(true);
  });

  it('rechaza monto negativo', () => {
    const result = AbrirCajaSchema.safeParse({ montoApertura: -100 });
    expect(result.success).toBe(false);
  });

  it('rechaza cuando falta montoApertura', () => {
    const result = AbrirCajaSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('acepta sucursalId y notas opcionales', () => {
    const result = AbrirCajaSchema.safeParse({
      montoApertura: 1000,
      sucursalId: 'suc-123',
      notas: 'Turno mañana',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sucursalId).toBe('suc-123');
      expect(result.data.notas).toBe('Turno mañana');
    }
  });

  it('rechaza notas demasiado largas', () => {
    const result = AbrirCajaSchema.safeParse({
      montoApertura: 0,
      notas: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe('CerrarCajaSchema', () => {
  it('acepta monto de cierre de 0', () => {
    const result = CerrarCajaSchema.safeParse({ montoCierreDeclarado: 0 });
    expect(result.success).toBe(true);
  });

  it('acepta monto positivo', () => {
    const result = CerrarCajaSchema.safeParse({ montoCierreDeclarado: 7500.50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.montoCierreDeclarado).toBe(7500.50);
    }
  });

  it('rechaza monto negativo', () => {
    const result = CerrarCajaSchema.safeParse({ montoCierreDeclarado: -1 });
    expect(result.success).toBe(false);
  });

  it('rechaza cuando falta montoCierreDeclarado', () => {
    const result = CerrarCajaSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('acepta notas opcionales', () => {
    const result = CerrarCajaSchema.safeParse({
      montoCierreDeclarado: 5000,
      notas: 'Cuadró perfectamente',
    });
    expect(result.success).toBe(true);
  });
});
