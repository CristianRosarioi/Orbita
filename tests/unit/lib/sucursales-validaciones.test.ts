import { describe, it, expect } from 'vitest';
import {
  CreateSucursalSchema,
  UpdateSucursalSchema,
  CreateTransferenciaSchema,
} from '@/lib/validations/sucursales';

describe('CreateSucursalSchema', () => {
  const base = { nombre: 'Sucursal Norte', codigo: 'SN01' };

  it('acepta datos mínimos requeridos', () => {
    const result = CreateSucursalSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('acepta todos los campos opcionales', () => {
    const result = CreateSucursalSchema.safeParse({
      ...base,
      ciudad: 'Santiago',
      telefono: '809-582-0000',
      encargado: 'Pedro Martínez',
      direccion: 'Av. Francia #45',
      esPrincipal: false,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const result = CreateSucursalSchema.safeParse({ ...base, nombre: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza código vacío', () => {
    const result = CreateSucursalSchema.safeParse({ ...base, codigo: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza código demasiado largo', () => {
    const result = CreateSucursalSchema.safeParse({ ...base, codigo: 'MUYLARGO99' });
    expect(result.success).toBe(true); // 10 chars exactos
    const result2 = CreateSucursalSchema.safeParse({ ...base, codigo: 'DEMASIADO123' });
    expect(result2.success).toBe(false);
  });
});

describe('UpdateSucursalSchema', () => {
  it('acepta objeto vacío (todo opcional)', () => {
    const result = UpdateSucursalSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('acepta marcar como inactiva', () => {
    const result = UpdateSucursalSchema.safeParse({ activa: false });
    expect(result.success).toBe(true);
  });

  it('acepta actualización parcial', () => {
    const result = UpdateSucursalSchema.safeParse({ ciudad: 'La Romana', telefono: '809-550-0000' });
    expect(result.success).toBe(true);
  });

  it('rechaza nombre vacío si se provee', () => {
    const result = UpdateSucursalSchema.safeParse({ nombre: '' });
    expect(result.success).toBe(false);
  });
});

describe('CreateTransferenciaSchema', () => {
  const base = {
    sucursalOrigenId: 'suc_1',
    sucursalDestinoId: 'suc_2',
    productoId: 'prod_1',
    cantidad: 10,
  };

  it('acepta transferencia válida', () => {
    const result = CreateTransferenciaSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('rechaza cuando origen y destino son iguales', () => {
    const result = CreateTransferenciaSchema.safeParse({
      ...base,
      sucursalDestinoId: 'suc_1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((e) => e.path.join('.'));
      expect(paths).toContain('sucursalDestinoId');
    }
  });

  it('rechaza cantidad cero', () => {
    const result = CreateTransferenciaSchema.safeParse({ ...base, cantidad: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza cantidad negativa', () => {
    const result = CreateTransferenciaSchema.safeParse({ ...base, cantidad: -5 });
    expect(result.success).toBe(false);
  });

  it('rechaza sin sucursalOrigenId', () => {
    const result = CreateTransferenciaSchema.safeParse({ ...base, sucursalOrigenId: '' });
    expect(result.success).toBe(false);
  });

  it('acepta notas opcionales', () => {
    const result = CreateTransferenciaSchema.safeParse({ ...base, notas: 'Reabastecimiento mensual' });
    expect(result.success).toBe(true);
  });

  it('acepta cantidad decimal', () => {
    const result = CreateTransferenciaSchema.safeParse({ ...base, cantidad: 2.5 });
    expect(result.success).toBe(true);
  });
});
