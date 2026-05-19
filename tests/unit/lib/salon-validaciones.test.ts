import { describe, it, expect } from 'vitest';
import { CreateCitaSchema, UpdateCitaSchema } from '@/lib/validations/salon';

const baseCita = {
  clienteNombre: 'María García',
  servicio: 'Corte y tinte',
  fecha: '2026-05-20T10:00',
  precio: 1500,
};

describe('CreateCitaSchema', () => {
  it('acepta datos mínimos requeridos', () => {
    const result = CreateCitaSchema.safeParse(baseCita);
    expect(result.success).toBe(true);
  });

  it('acepta todos los campos opcionales', () => {
    const result = CreateCitaSchema.safeParse({
      ...baseCita,
      clienteTelefono: '809-555-1234',
      duracionMin: 90,
      notas: 'Alérgica a algunos tintes',
    });
    expect(result.success).toBe(true);
  });

  it('usa duracionMin por defecto de 60', () => {
    const result = CreateCitaSchema.safeParse(baseCita);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.duracionMin).toBe(60);
  });

  it('rechaza clienteNombre vacío', () => {
    const result = CreateCitaSchema.safeParse({ ...baseCita, clienteNombre: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza servicio vacío', () => {
    const result = CreateCitaSchema.safeParse({ ...baseCita, servicio: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza precio cero', () => {
    const result = CreateCitaSchema.safeParse({ ...baseCita, precio: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza precio negativo', () => {
    const result = CreateCitaSchema.safeParse({ ...baseCita, precio: -500 });
    expect(result.success).toBe(false);
  });

  it('rechaza fecha con formato inválido (solo fecha sin hora)', () => {
    const result = CreateCitaSchema.safeParse({ ...baseCita, fecha: '2026-05-20' });
    expect(result.success).toBe(false);
  });

  it('rechaza fecha completamente inválida', () => {
    const result = CreateCitaSchema.safeParse({ ...baseCita, fecha: 'mañana' });
    expect(result.success).toBe(false);
  });

  it('rechaza duracionMin menor a 15', () => {
    const result = CreateCitaSchema.safeParse({ ...baseCita, duracionMin: 10 });
    expect(result.success).toBe(false);
  });

  it('rechaza duracionMin mayor a 480', () => {
    const result = CreateCitaSchema.safeParse({ ...baseCita, duracionMin: 500 });
    expect(result.success).toBe(false);
  });

  it('acepta duraciones dentro del rango válido', () => {
    for (const duracion of [15, 30, 60, 120, 480]) {
      const result = CreateCitaSchema.safeParse({ ...baseCita, duracionMin: duracion });
      expect(result.success).toBe(true);
    }
  });

  it('acepta fecha con formato completo ISO', () => {
    const result = CreateCitaSchema.safeParse({ ...baseCita, fecha: '2026-12-31T23:59' });
    expect(result.success).toBe(true);
  });
});

describe('UpdateCitaSchema', () => {
  it('acepta objeto vacío (todo opcional)', () => {
    const result = UpdateCitaSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('acepta todos los estados válidos', () => {
    const estados = ['PENDIENTE', 'CONFIRMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA', 'NO_SHOW'];
    for (const estado of estados) {
      const result = UpdateCitaSchema.safeParse({ estado });
      expect(result.success).toBe(true);
    }
  });

  it('rechaza estado inválido', () => {
    const result = UpdateCitaSchema.safeParse({ estado: 'ATENDIDA' });
    expect(result.success).toBe(false);
  });

  it('acepta actualización parcial de servicio', () => {
    const result = UpdateCitaSchema.safeParse({ servicio: 'Manicure' });
    expect(result.success).toBe(true);
  });

  it('acepta actualización de precio', () => {
    const result = UpdateCitaSchema.safeParse({ precio: 2000 });
    expect(result.success).toBe(true);
  });

  it('rechaza precio negativo en update', () => {
    const result = UpdateCitaSchema.safeParse({ precio: -100 });
    expect(result.success).toBe(false);
  });

  it('rechaza fecha con formato inválido en update', () => {
    const result = UpdateCitaSchema.safeParse({ fecha: '20/05/2026 10:00' });
    expect(result.success).toBe(false);
  });

  it('acepta combinación de campos', () => {
    const result = UpdateCitaSchema.safeParse({
      estado: 'CONFIRMADA',
      notas: 'Confirmada vía WhatsApp',
      precio: 1800,
    });
    expect(result.success).toBe(true);
  });
});
