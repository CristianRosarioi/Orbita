import { describe, it, expect } from 'vitest';
import {
  CreateCuentaFiadoSchema,
  UpdateCuentaFiadoSchema,
  CargoFiadoSchema,
  AbonoFiadoSchema,
} from '@/lib/validations/colmado';

describe('CreateCuentaFiadoSchema', () => {
  it('válido: con clienteId', () => {
    const result = CreateCuentaFiadoSchema.safeParse({ clienteId: 'abc123' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limite).toBe(0);
  });

  it('válido: con clienteId y límite', () => {
    const result = CreateCuentaFiadoSchema.safeParse({ clienteId: 'abc', limite: 5000 });
    expect(result.success).toBe(true);
  });

  it('inválido: sin clienteId', () => {
    const result = CreateCuentaFiadoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('inválido: clienteId vacío', () => {
    const result = CreateCuentaFiadoSchema.safeParse({ clienteId: '' });
    expect(result.success).toBe(false);
  });

  it('inválido: límite negativo', () => {
    const result = CreateCuentaFiadoSchema.safeParse({ clienteId: 'abc', limite: -100 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateCuentaFiadoSchema', () => {
  it('válido: objeto vacío (todos opcionales)', () => {
    const result = UpdateCuentaFiadoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('válido: actualizar límite', () => {
    const result = UpdateCuentaFiadoSchema.safeParse({ limite: 10000 });
    expect(result.success).toBe(true);
  });

  it('inválido: estado desconocido', () => {
    const result = UpdateCuentaFiadoSchema.safeParse({ estado: 'BLOQUEADO' });
    expect(result.success).toBe(false);
  });
});

describe('CargoFiadoSchema', () => {
  it('válido: monto positivo', () => {
    const result = CargoFiadoSchema.safeParse({ monto: 200 });
    expect(result.success).toBe(true);
  });

  it('válido: monto con descripción', () => {
    const result = CargoFiadoSchema.safeParse({ monto: 500, descripcion: 'Compra de arroz' });
    expect(result.success).toBe(true);
  });

  it('inválido: monto cero', () => {
    const result = CargoFiadoSchema.safeParse({ monto: 0 });
    expect(result.success).toBe(false);
  });

  it('inválido: monto negativo', () => {
    const result = CargoFiadoSchema.safeParse({ monto: -50 });
    expect(result.success).toBe(false);
  });

  it('inválido: sin monto', () => {
    const result = CargoFiadoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('AbonoFiadoSchema', () => {
  it('válido: monto positivo', () => {
    const result = AbonoFiadoSchema.safeParse({ monto: 1000 });
    expect(result.success).toBe(true);
  });

  it('válido: monto con descripción', () => {
    const result = AbonoFiadoSchema.safeParse({ monto: 500, descripcion: 'Pago en efectivo' });
    expect(result.success).toBe(true);
  });

  it('inválido: monto cero', () => {
    const result = AbonoFiadoSchema.safeParse({ monto: 0 });
    expect(result.success).toBe(false);
  });

  it('inválido: monto negativo', () => {
    const result = AbonoFiadoSchema.safeParse({ monto: -200 });
    expect(result.success).toBe(false);
  });
});
