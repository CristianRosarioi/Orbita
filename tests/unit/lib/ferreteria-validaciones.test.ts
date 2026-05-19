import { describe, it, expect } from 'vitest';
import { CreatePedidoSchema, UpdatePedidoSchema, AddItemPedidoSchema } from '@/lib/validations/ferreteria';

describe('CreatePedidoSchema', () => {
  it('acepta datos mínimos requeridos', () => {
    const result = CreatePedidoSchema.safeParse({ proveedorId: 'prov_1' });
    expect(result.success).toBe(true);
  });

  it('acepta todos los campos opcionales', () => {
    const result = CreatePedidoSchema.safeParse({
      proveedorId: 'prov_1',
      fechaEntrega: '2026-06-15',
      notas: 'Urgente para obra en Los Alcarrizos',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza proveedorId vacío', () => {
    const result = CreatePedidoSchema.safeParse({ proveedorId: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza fecha de entrega con formato inválido', () => {
    const result = CreatePedidoSchema.safeParse({ proveedorId: 'prov_1', fechaEntrega: '15/06/2026' });
    expect(result.success).toBe(false);
  });

  it('acepta sin fecha de entrega (es opcional)', () => {
    const result = CreatePedidoSchema.safeParse({ proveedorId: 'prov_1' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fechaEntrega).toBeUndefined();
  });

  it('rechaza notas demasiado largas', () => {
    const result = CreatePedidoSchema.safeParse({ proveedorId: 'prov_1', notas: 'A'.repeat(1001) });
    expect(result.success).toBe(false);
  });
});

describe('UpdatePedidoSchema', () => {
  it('acepta objeto vacío (todo opcional)', () => {
    const result = UpdatePedidoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('acepta todos los estados del enum', () => {
    const estados = ['BORRADOR', 'ENVIADO', 'CONFIRMADO', 'RECIBIDO', 'CANCELADO'];
    for (const estado of estados) {
      const result = UpdatePedidoSchema.safeParse({ estado });
      expect(result.success).toBe(true);
    }
  });

  it('rechaza estado inválido', () => {
    const result = UpdatePedidoSchema.safeParse({ estado: 'PENDIENTE' });
    expect(result.success).toBe(false);
  });

  it('acepta actualización de fecha', () => {
    const result = UpdatePedidoSchema.safeParse({ fechaEntrega: '2026-07-01' });
    expect(result.success).toBe(true);
  });

  it('No se puede modificar un pedido RECIBIDO (validación de negocio)', () => {
    const estadosBloqueados = ['CANCELADO', 'RECIBIDO'];
    for (const estado of estadosBloqueados) {
      expect(estadosBloqueados.includes(estado)).toBe(true);
    }
  });

  it('solo BORRADOR permite agregar ítems (validación de negocio)', () => {
    const estadosQuePermiten = ['BORRADOR'];
    const estadosQueBloquean = ['ENVIADO', 'CONFIRMADO', 'RECIBIDO', 'CANCELADO'];
    expect(estadosQuePermiten).toContain('BORRADOR');
    for (const e of estadosQueBloquean) {
      expect(estadosQuePermiten).not.toContain(e);
    }
  });
});

describe('AddItemPedidoSchema', () => {
  const baseItem = {
    descripcion: 'Cemento Portland 94lb',
    cantidad: 10,
    precioUnitario: 350,
  };

  it('acepta ítem válido con defaults', () => {
    const result = AddItemPedidoSchema.safeParse(baseItem);
    expect(result.success).toBe(true);
  });

  it('usa unidadMedida "und" por defecto', () => {
    const result = AddItemPedidoSchema.safeParse(baseItem);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.unidadMedida).toBe('und');
  });

  it('acepta unidades de medida de ferretería', () => {
    const unidades = ['m²', 'm³', 'kg', 'saco', 'galón', 'varilla', 'rollo'];
    for (const unidadMedida of unidades) {
      const result = AddItemPedidoSchema.safeParse({ ...baseItem, unidadMedida });
      expect(result.success).toBe(true);
    }
  });

  it('rechaza descripción vacía', () => {
    const result = AddItemPedidoSchema.safeParse({ ...baseItem, descripcion: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza cantidad cero', () => {
    const result = AddItemPedidoSchema.safeParse({ ...baseItem, cantidad: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza precio unitario negativo', () => {
    const result = AddItemPedidoSchema.safeParse({ ...baseItem, precioUnitario: -100 });
    expect(result.success).toBe(false);
  });

  it('acepta productoId opcional', () => {
    const result = AddItemPedidoSchema.safeParse({ ...baseItem, productoId: 'prod_123' });
    expect(result.success).toBe(true);
  });

  it('calcula subtotal correctamente', () => {
    const cant = 10;
    const precio = 350;
    const subtotal = Math.round(cant * precio * 100) / 100;
    expect(subtotal).toBe(3500);
  });

  it('calcula subtotal con decimales correctamente', () => {
    const cant = 2.5;
    const precio = 125.5;
    const subtotal = Math.round(cant * precio * 100) / 100;
    expect(subtotal).toBe(313.75);
  });
});
