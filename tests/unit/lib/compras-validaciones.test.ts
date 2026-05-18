import { describe, it, expect } from 'vitest';
import {
  CreateOrdenCompraSchema,
  RecibirOrdenSchema,
  CreateGastoSchema,
  UpdateGastoSchema,
} from '@/lib/validations/compras';

describe('CreateOrdenCompraSchema', () => {
  const itemValido = {
    descripcion: 'Papel bond 8.5x11',
    cantidad: 10,
    costoUnitario: 250,
    itbisPorcentaje: 18,
  };

  it('acepta una orden válida con un ítem', () => {
    const result = CreateOrdenCompraSchema.safeParse({
      proveedorId: 'prov_123',
      items: [itemValido],
    });
    expect(result.success).toBe(true);
  });

  it('acepta orden con notas y fechaEsperada', () => {
    const result = CreateOrdenCompraSchema.safeParse({
      proveedorId: 'prov_123',
      items: [itemValido],
      notas: 'Entregar en almacén principal',
      fechaEsperada: '2026-06-01',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza orden sin proveedorId', () => {
    const result = CreateOrdenCompraSchema.safeParse({ items: [itemValido] });
    expect(result.success).toBe(false);
  });

  it('rechaza orden sin ítems', () => {
    const result = CreateOrdenCompraSchema.safeParse({
      proveedorId: 'prov_123',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('rechaza ítem con cantidad 0', () => {
    const result = CreateOrdenCompraSchema.safeParse({
      proveedorId: 'prov_123',
      items: [{ ...itemValido, cantidad: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rechaza ítem con descripcion vacía', () => {
    const result = CreateOrdenCompraSchema.safeParse({
      proveedorId: 'prov_123',
      items: [{ ...itemValido, descripcion: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('acepta ítem con itbisPorcentaje 0 por defecto', () => {
    const result = CreateOrdenCompraSchema.safeParse({
      proveedorId: 'prov_123',
      items: [{ descripcion: 'Item', cantidad: 1, costoUnitario: 100 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0]?.itbisPorcentaje).toBe(0);
    }
  });

  it('rechaza itbisPorcentaje mayor a 100', () => {
    const result = CreateOrdenCompraSchema.safeParse({
      proveedorId: 'prov_123',
      items: [{ ...itemValido, itbisPorcentaje: 101 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('RecibirOrdenSchema', () => {
  it('acepta recepción válida', () => {
    const result = RecibirOrdenSchema.safeParse({
      items: [{ itemId: 'item_1', cantidadRecibida: 5 }],
    });
    expect(result.success).toBe(true);
  });

  it('acepta cantidad 0 (ninguno recibido aún)', () => {
    const result = RecibirOrdenSchema.safeParse({
      items: [{ itemId: 'item_1', cantidadRecibida: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it('rechaza sin ítems', () => {
    const result = RecibirOrdenSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it('rechaza ítem sin itemId', () => {
    const result = RecibirOrdenSchema.safeParse({
      items: [{ cantidadRecibida: 5 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateGastoSchema', () => {
  const gastoValido = {
    descripcion: 'Pago de energía eléctrica',
    monto: 12500,
    fechaGasto: '2026-05-01',
  };

  it('acepta gasto mínimo válido', () => {
    const result = CreateGastoSchema.safeParse(gastoValido);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.itbis).toBe(0);
    }
  });

  it('acepta gasto completo con NCF y proveedor', () => {
    const result = CreateGastoSchema.safeParse({
      ...gastoValido,
      itbis: 2250,
      categoria: 'SERVICIOS_PUBLICOS',
      proveedorId: 'prov_abc',
      comprobante: 'REC-001',
      ncfProveedor: 'B0100000001',
      notas: 'Mes de mayo 2026',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza monto de 0', () => {
    const result = CreateGastoSchema.safeParse({ ...gastoValido, monto: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza monto negativo', () => {
    const result = CreateGastoSchema.safeParse({ ...gastoValido, monto: -100 });
    expect(result.success).toBe(false);
  });

  it('rechaza descripcion vacía', () => {
    const result = CreateGastoSchema.safeParse({ ...gastoValido, descripcion: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza sin fechaGasto', () => {
    const result = CreateGastoSchema.safeParse({ descripcion: 'Test', monto: 100 });
    expect(result.success).toBe(false);
  });

  it('rechaza NCF mayor a 19 caracteres', () => {
    const result = CreateGastoSchema.safeParse({
      ...gastoValido,
      ncfProveedor: 'B'.repeat(20),
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateGastoSchema', () => {
  it('acepta marcar como PAGADO', () => {
    const result = UpdateGastoSchema.safeParse({ estado: 'PAGADO' });
    expect(result.success).toBe(true);
  });

  it('acepta PAGADO con fechaPago', () => {
    const result = UpdateGastoSchema.safeParse({
      estado: 'PAGADO',
      fechaPago: '2026-05-15',
    });
    expect(result.success).toBe(true);
  });

  it('acepta schema vacío (solo notas)', () => {
    const result = UpdateGastoSchema.safeParse({ notas: 'Actualización de notas' });
    expect(result.success).toBe(true);
  });

  it('rechaza estado inválido', () => {
    const result = UpdateGastoSchema.safeParse({ estado: 'DESCONOCIDO' });
    expect(result.success).toBe(false);
  });
});
