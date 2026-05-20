import { describe, it, expect } from 'vitest';
import {
  CrearPiezaSchema,
  ActualizarPiezaSchema,
  CrearReparacionSchema,
  ActualizarReparacionSchema,
} from '@/lib/validations/joyeria';

// ─── CrearPiezaSchema ────────────────────────────────────────────────────────

describe('CrearPiezaSchema', () => {
  const base = {
    codigo: 'JY-0001',
    nombre: 'Anillo solitario 18K',
    tipo: 'Anillo',
    material: 'ORO_18K',
    precioVenta: 25000,
  };

  it('acepta pieza válida', () => {
    const result = CrearPiezaSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('falla si el precio de venta es 0', () => {
    const result = CrearPiezaSchema.safeParse({ ...base, precioVenta: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('mayor que 0');
    }
  });

  it('falla si el precio de venta es negativo', () => {
    const result = CrearPiezaSchema.safeParse({ ...base, precioVenta: -500 });
    expect(result.success).toBe(false);
  });

  it('acepta todos los materiales válidos', () => {
    const materiales = ['ORO_18K', 'ORO_14K', 'ORO_10K', 'PLATA_925', 'PLATINO', 'OTRO'];
    for (const material of materiales) {
      expect(CrearPiezaSchema.safeParse({ ...base, material }).success).toBe(true);
    }
  });

  it('falla con material inválido', () => {
    const result = CrearPiezaSchema.safeParse({ ...base, material: 'COBRE' });
    expect(result.success).toBe(false);
  });

  it('acepta campos opcionales como peso y quilates', () => {
    const result = CrearPiezaSchema.safeParse({ ...base, pesoGramos: 3.5, quilates: 0.5 });
    expect(result.success).toBe(true);
  });

  it('falla si el código está vacío', () => {
    const result = CrearPiezaSchema.safeParse({ ...base, codigo: '' });
    expect(result.success).toBe(false);
  });
});

// ─── ActualizarPiezaSchema ───────────────────────────────────────────────────

describe('ActualizarPiezaSchema', () => {
  it('acepta actualizar solo el estado', () => {
    const result = ActualizarPiezaSchema.safeParse({ estado: 'VENDIDA' });
    expect(result.success).toBe(true);
  });

  it('acepta todos los estados válidos', () => {
    const estados = ['EN_VITRINA', 'VENDIDA', 'EN_REPARACION', 'RESERVADA', 'CONSIGNACION'];
    for (const estado of estados) {
      expect(ActualizarPiezaSchema.safeParse({ estado }).success).toBe(true);
    }
  });

  it('falla con estado inválido', () => {
    const result = ActualizarPiezaSchema.safeParse({ estado: 'PERDIDA' });
    expect(result.success).toBe(false);
  });
});

// ─── CrearReparacionSchema ───────────────────────────────────────────────────

describe('CrearReparacionSchema', () => {
  const base = {
    clienteNombre: 'María González',
    descripcion: 'Reducir talla del anillo de 8 a 6',
  };

  it('acepta reparación válida', () => {
    const result = CrearReparacionSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('falla si el nombre del cliente está vacío', () => {
    const result = CrearReparacionSchema.safeParse({ ...base, clienteNombre: '' });
    expect(result.success).toBe(false);
  });

  it('falla si la descripción está vacía', () => {
    const result = CrearReparacionSchema.safeParse({ ...base, descripcion: '' });
    expect(result.success).toBe(false);
  });

  it('acepta reparación con presupuesto y fecha promesa', () => {
    const result = CrearReparacionSchema.safeParse({
      ...base,
      presupuesto: 800,
      fechaPromesa: '2026-06-15',
    });
    expect(result.success).toBe(true);
  });
});

// ─── ActualizarReparacionSchema ──────────────────────────────────────────────

describe('ActualizarReparacionSchema', () => {
  it('acepta actualizar solo el estado', () => {
    const result = ActualizarReparacionSchema.safeParse({ estado: 'EN_PROCESO' });
    expect(result.success).toBe(true);
  });

  it('acepta todos los estados válidos', () => {
    const estados = ['RECIBIDA', 'EN_PROCESO', 'LISTA', 'ENTREGADA'];
    for (const estado of estados) {
      expect(ActualizarReparacionSchema.safeParse({ estado }).success).toBe(true);
    }
  });

  it('falla con estado inválido', () => {
    const result = ActualizarReparacionSchema.safeParse({ estado: 'CANCELADA' });
    expect(result.success).toBe(false);
  });

  it('acepta costo final positivo', () => {
    const result = ActualizarReparacionSchema.safeParse({ costoFinal: 1200 });
    expect(result.success).toBe(true);
  });
});
