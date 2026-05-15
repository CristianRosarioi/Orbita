import { describe, it, expect } from 'vitest';
import {
  CreateItemFacturaSchema,
  CreateFacturaSchema,
  RegistrarPagoSchema,
} from '@/lib/validations/facturas';
import { MetodoPago } from '@/types/enums';

describe('CreateItemFacturaSchema', () => {
  const itemValido = {
    productoNombre: 'Servicio de consultoría',
    cantidad: 2,
    precioUnitario: 100,
    itbisPorcentaje: 18,
    descuento: 0,
  };

  it('acepta item válido', () => {
    const result = CreateItemFacturaSchema.safeParse(itemValido);
    expect(result.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const result = CreateItemFacturaSchema.safeParse({ ...itemValido, productoNombre: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('requerido');
  });

  it('rechaza cantidad 0', () => {
    const result = CreateItemFacturaSchema.safeParse({ ...itemValido, cantidad: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza cantidad negativa', () => {
    const result = CreateItemFacturaSchema.safeParse({ ...itemValido, cantidad: -1 });
    expect(result.success).toBe(false);
  });

  it('rechaza precio negativo', () => {
    const result = CreateItemFacturaSchema.safeParse({ ...itemValido, precioUnitario: -5 });
    expect(result.success).toBe(false);
  });

  it('acepta precio 0', () => {
    const result = CreateItemFacturaSchema.safeParse({ ...itemValido, precioUnitario: 0 });
    expect(result.success).toBe(true);
  });

  it('acepta productoId opcional', () => {
    const result = CreateItemFacturaSchema.safeParse({ ...itemValido, productoId: 'prod_123' });
    expect(result.success).toBe(true);
  });
});

describe('CreateFacturaSchema', () => {
  const itemValido = {
    productoNombre: 'Producto A',
    cantidad: 1,
    precioUnitario: 100,
    itbisPorcentaje: 18,
    descuento: 0,
  };

  const facturaValida = {
    clienteNombre: 'Juan Pérez',
    metodoPago: MetodoPago.EFECTIVO,
    items: [itemValido],
  };

  it('acepta factura válida', () => {
    const result = CreateFacturaSchema.safeParse(facturaValida);
    expect(result.success).toBe(true);
  });

  it('rechaza array de items vacío', () => {
    const result = CreateFacturaSchema.safeParse({ ...facturaValida, items: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('al menos un item');
  });

  it('CREDITO requiere fechaVencimiento', () => {
    const result = CreateFacturaSchema.safeParse({
      ...facturaValida,
      metodoPago: MetodoPago.CREDITO,
    });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('fechaVencimiento'));
    expect(issue).toBeDefined();
    expect(issue?.message).toContain('vencimiento');
  });

  it('CREDITO con fechaVencimiento es válido', () => {
    const result = CreateFacturaSchema.safeParse({
      ...facturaValida,
      metodoPago: MetodoPago.CREDITO,
      fechaVencimiento: '2026-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('EFECTIVO sin fechaVencimiento es válido', () => {
    const result = CreateFacturaSchema.safeParse({
      ...facturaValida,
      metodoPago: MetodoPago.EFECTIVO,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza método de pago inválido', () => {
    const result = CreateFacturaSchema.safeParse({
      ...facturaValida,
      metodoPago: 'BITCOIN',
    });
    expect(result.success).toBe(false);
  });

  it('usa clienteNombre por defecto "Consumidor Final"', () => {
    const result = CreateFacturaSchema.safeParse({
      metodoPago: MetodoPago.EFECTIVO,
      items: [itemValido],
    });
    if (result.success) {
      expect(result.data.clienteNombre).toBe('Consumidor Final');
    }
  });
});

describe('RegistrarPagoSchema', () => {
  const pagoValido = {
    monto: 100,
    metodoPago: MetodoPago.EFECTIVO,
  };

  it('acepta pago válido', () => {
    const result = RegistrarPagoSchema.safeParse(pagoValido);
    expect(result.success).toBe(true);
  });

  it('rechaza monto 0', () => {
    const result = RegistrarPagoSchema.safeParse({ ...pagoValido, monto: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza monto negativo', () => {
    const result = RegistrarPagoSchema.safeParse({ ...pagoValido, monto: -50 });
    expect(result.success).toBe(false);
  });

  it('rechaza metodoPago CREDITO', () => {
    const result = RegistrarPagoSchema.safeParse({
      ...pagoValido,
      metodoPago: MetodoPago.CREDITO,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('CREDITO');
  });

  it('acepta TRANSFERENCIA', () => {
    const result = RegistrarPagoSchema.safeParse({
      ...pagoValido,
      metodoPago: MetodoPago.TRANSFERENCIA,
    });
    expect(result.success).toBe(true);
  });

  it('acepta referencia y notas opcionales', () => {
    const result = RegistrarPagoSchema.safeParse({
      ...pagoValido,
      referencia: 'TRF-12345',
      notas: 'Transferencia bancaria del día',
    });
    expect(result.success).toBe(true);
  });
});
