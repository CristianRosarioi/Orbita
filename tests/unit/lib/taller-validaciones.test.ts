import { describe, it, expect } from 'vitest';
import {
  CreateOrdenTrabajoSchema,
  UpdateOrdenTrabajoSchema,
  AddItemOrdenTrabajoSchema,
  FacturarOrdenTrabajoSchema,
} from '@/lib/validations/taller';

const baseOrden = {
  clienteNombre: 'Juan Pérez',
  vehiculoMarca: 'Toyota',
  vehiculoModelo: 'Corolla',
  vehiculoPlaca: 'A123456',
  descripcionFalla: 'El motor hace ruido al arrancar',
};

describe('CreateOrdenTrabajoSchema', () => {
  it('acepta datos mínimos requeridos', () => {
    const result = CreateOrdenTrabajoSchema.safeParse(baseOrden);
    expect(result.success).toBe(true);
  });

  it('acepta todos los campos opcionales', () => {
    const result = CreateOrdenTrabajoSchema.safeParse({
      ...baseOrden,
      vehiculoAnio: 2020,
      vehiculoColor: 'Rojo',
      kilometraje: 45000,
      tecnico: 'Pedro',
      fechaPromesa: '2026-05-20',
      notas: 'Revisar aceite también',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza clienteNombre vacío', () => {
    const result = CreateOrdenTrabajoSchema.safeParse({ ...baseOrden, clienteNombre: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza vehiculoMarca vacía', () => {
    const result = CreateOrdenTrabajoSchema.safeParse({ ...baseOrden, vehiculoMarca: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza vehiculoPlaca vacía', () => {
    const result = CreateOrdenTrabajoSchema.safeParse({ ...baseOrden, vehiculoPlaca: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza descripcionFalla vacía', () => {
    const result = CreateOrdenTrabajoSchema.safeParse({ ...baseOrden, descripcionFalla: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza vehiculoAnio fuera de rango', () => {
    const result = CreateOrdenTrabajoSchema.safeParse({ ...baseOrden, vehiculoAnio: 1800 });
    expect(result.success).toBe(false);
  });

  it('rechaza fechaPromesa con formato inválido', () => {
    const result = CreateOrdenTrabajoSchema.safeParse({ ...baseOrden, fechaPromesa: '20-05-2026' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateOrdenTrabajoSchema', () => {
  it('acepta objeto vacío (todo opcional)', () => {
    const result = UpdateOrdenTrabajoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('acepta estado válido LISTO', () => {
    const result = UpdateOrdenTrabajoSchema.safeParse({ estado: 'LISTO' });
    expect(result.success).toBe(true);
  });

  it('acepta todos los estados del enum', () => {
    const estados = [
      'RECIBIDO',
      'EN_DIAGNOSTICO',
      'ESPERANDO_REPUESTOS',
      'EN_REPARACION',
      'LISTO',
      'ENTREGADO',
      'CANCELADO',
    ];
    for (const estado of estados) {
      const result = UpdateOrdenTrabajoSchema.safeParse({ estado });
      expect(result.success).toBe(true);
    }
  });

  it('rechaza estado inválido', () => {
    const result = UpdateOrdenTrabajoSchema.safeParse({ estado: 'REPARADO' });
    expect(result.success).toBe(false);
  });

  it('acepta diagnóstico con texto largo', () => {
    const result = UpdateOrdenTrabajoSchema.safeParse({ diagnostico: 'A'.repeat(2000) });
    expect(result.success).toBe(true);
  });

  it('rechaza diagnóstico demasiado largo', () => {
    const result = UpdateOrdenTrabajoSchema.safeParse({ diagnostico: 'A'.repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe('AddItemOrdenTrabajoSchema', () => {
  const baseItem = {
    tipo: 'SERVICIO' as const,
    descripcion: 'Cambio de aceite',
    cantidad: 1,
    precioUnitario: 500,
  };

  it('acepta ítem de servicio válido', () => {
    const result = AddItemOrdenTrabajoSchema.safeParse(baseItem);
    expect(result.success).toBe(true);
  });

  it('acepta ítem de repuesto', () => {
    const result = AddItemOrdenTrabajoSchema.safeParse({ ...baseItem, tipo: 'REPUESTO' });
    expect(result.success).toBe(true);
  });

  it('usa itbisPorcentaje por defecto de 18', () => {
    const result = AddItemOrdenTrabajoSchema.safeParse(baseItem);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.itbisPorcentaje).toBe(18);
  });

  it('acepta itbisPorcentaje en 0 (exento)', () => {
    const result = AddItemOrdenTrabajoSchema.safeParse({ ...baseItem, itbisPorcentaje: 0 });
    expect(result.success).toBe(true);
  });

  it('rechaza tipo inválido', () => {
    const result = AddItemOrdenTrabajoSchema.safeParse({ ...baseItem, tipo: 'MANO_OBRA' });
    expect(result.success).toBe(false);
  });

  it('rechaza cantidad cero', () => {
    const result = AddItemOrdenTrabajoSchema.safeParse({ ...baseItem, cantidad: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza precio negativo', () => {
    const result = AddItemOrdenTrabajoSchema.safeParse({ ...baseItem, precioUnitario: -100 });
    expect(result.success).toBe(false);
  });

  it('rechaza descripción vacía', () => {
    const result = AddItemOrdenTrabajoSchema.safeParse({ ...baseItem, descripcion: '' });
    expect(result.success).toBe(false);
  });
});

describe('FacturarOrdenTrabajoSchema', () => {
  it('acepta método de pago EFECTIVO', () => {
    const result = FacturarOrdenTrabajoSchema.safeParse({ metodoPago: 'EFECTIVO' });
    expect(result.success).toBe(true);
  });

  it('acepta método CREDITO', () => {
    const result = FacturarOrdenTrabajoSchema.safeParse({ metodoPago: 'CREDITO' });
    expect(result.success).toBe(true);
  });

  it('rechaza método de pago inválido', () => {
    const result = FacturarOrdenTrabajoSchema.safeParse({ metodoPago: 'BITCOIN' });
    expect(result.success).toBe(false);
  });

  it('rechaza cuando falta metodoPago', () => {
    const result = FacturarOrdenTrabajoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
