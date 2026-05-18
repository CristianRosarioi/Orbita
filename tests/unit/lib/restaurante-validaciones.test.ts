import { describe, it, expect } from 'vitest';
import {
  CreateMesaSchema,
  UpdateMesaSchema,
  CreateComandaSchema,
  UpdateComandaSchema,
  AddItemComandaSchema,
  UpdateItemComandaSchema,
} from '@/lib/validations/restaurante';

describe('CreateMesaSchema', () => {
  it('válido: número positivo y capacidad por defecto', () => {
    const result = CreateMesaSchema.safeParse({ numero: 5 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.capacidad).toBe(4);
  });

  it('válido: número, nombre y capacidad', () => {
    const result = CreateMesaSchema.safeParse({ numero: 1, nombre: 'Terraza', capacidad: 8 });
    expect(result.success).toBe(true);
  });

  it('inválido: número cero', () => {
    const result = CreateMesaSchema.safeParse({ numero: 0 });
    expect(result.success).toBe(false);
  });

  it('inválido: número negativo', () => {
    const result = CreateMesaSchema.safeParse({ numero: -1 });
    expect(result.success).toBe(false);
  });

  it('inválido: capacidad mayor a 50', () => {
    const result = CreateMesaSchema.safeParse({ numero: 1, capacidad: 51 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateMesaSchema', () => {
  it('válido: objeto vacío (todos opcionales)', () => {
    const result = UpdateMesaSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('válido: actualizar estado a RESERVADA', () => {
    const result = UpdateMesaSchema.safeParse({ estado: 'RESERVADA' });
    expect(result.success).toBe(true);
  });

  it('inválido: estado desconocido', () => {
    const result = UpdateMesaSchema.safeParse({ estado: 'CERRADA' });
    expect(result.success).toBe(false);
  });
});

describe('CreateComandaSchema', () => {
  it('válido: sin campos (todos opcionales)', () => {
    const result = CreateComandaSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.personas).toBe(1);
  });

  it('válido: con mesaId y mesero', () => {
    const result = CreateComandaSchema.safeParse({
      mesaId: 'abc123',
      mesero: 'Carlos',
      personas: 3,
    });
    expect(result.success).toBe(true);
  });

  it('inválido: personas 0', () => {
    const result = CreateComandaSchema.safeParse({ personas: 0 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateComandaSchema', () => {
  it('válido: actualizar a LISTA', () => {
    const result = UpdateComandaSchema.safeParse({ estado: 'LISTA' });
    expect(result.success).toBe(true);
  });

  it('válido: propina positiva', () => {
    const result = UpdateComandaSchema.safeParse({ propina: 150 });
    expect(result.success).toBe(true);
  });

  it('inválido: estado PAGADA no existe', () => {
    const result = UpdateComandaSchema.safeParse({ estado: 'PAGADA' });
    expect(result.success).toBe(false);
  });

  it('inválido: propina negativa', () => {
    const result = UpdateComandaSchema.safeParse({ propina: -10 });
    expect(result.success).toBe(false);
  });
});

describe('AddItemComandaSchema', () => {
  it('válido: nombre, cantidad y precio', () => {
    const result = AddItemComandaSchema.safeParse({
      nombre: 'Pollo guisado',
      cantidad: 2,
      precio: 350,
    });
    expect(result.success).toBe(true);
  });

  it('inválido: nombre vacío', () => {
    const result = AddItemComandaSchema.safeParse({ nombre: '', cantidad: 1, precio: 100 });
    expect(result.success).toBe(false);
  });

  it('inválido: cantidad cero', () => {
    const result = AddItemComandaSchema.safeParse({ nombre: 'Arroz', cantidad: 0, precio: 50 });
    expect(result.success).toBe(false);
  });

  it('inválido: precio negativo', () => {
    const result = AddItemComandaSchema.safeParse({ nombre: 'Arroz', cantidad: 1, precio: -5 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateItemComandaSchema', () => {
  it('válido: avanzar a EN_PREPARACION', () => {
    const result = UpdateItemComandaSchema.safeParse({ estado: 'EN_PREPARACION' });
    expect(result.success).toBe(true);
  });

  it('válido: cambiar cantidad', () => {
    const result = UpdateItemComandaSchema.safeParse({ cantidad: 3 });
    expect(result.success).toBe(true);
  });

  it('inválido: estado TERMINADO no existe', () => {
    const result = UpdateItemComandaSchema.safeParse({ estado: 'TERMINADO' });
    expect(result.success).toBe(false);
  });
});
