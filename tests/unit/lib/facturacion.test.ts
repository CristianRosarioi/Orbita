import { describe, it, expect } from 'vitest';
import { calcularTotalesFactura } from '@/lib/facturacion';

describe('calcularTotalesFactura', () => {
  it('item sin ITBIS (0%): 2 × RD$100 = subtotal 200, itbis 0, total 200', () => {
    const result = calcularTotalesFactura([
      { cantidad: 2, precioUnitario: 100, itbisPorcentaje: 0, descuento: 0 },
    ]);
    expect(result.subtotal).toBe(200);
    expect(result.itbis).toBe(0);
    expect(result.total).toBe(200);
    expect(result.items[0]?.subtotal).toBe(200);
    expect(result.items[0]?.itbisMonto).toBe(0);
    expect(result.items[0]?.total).toBe(200);
  });

  it('item con ITBIS 18%: 1 × RD$100 = subtotal 100, itbis 18, total 118', () => {
    const result = calcularTotalesFactura([
      { cantidad: 1, precioUnitario: 100, itbisPorcentaje: 18, descuento: 0 },
    ]);
    expect(result.subtotal).toBe(100);
    expect(result.itbis).toBe(18);
    expect(result.total).toBe(118);
    expect(result.items[0]?.itbisMonto).toBe(18);
    expect(result.items[0]?.total).toBe(118);
  });

  it('descuento global: total 118, descuento 18 = total 100', () => {
    const result = calcularTotalesFactura(
      [{ cantidad: 1, precioUnitario: 100, itbisPorcentaje: 18, descuento: 0 }],
      18,
    );
    expect(result.subtotal).toBe(100);
    expect(result.itbis).toBe(18);
    expect(result.descuento).toBe(18);
    expect(result.total).toBe(100);
  });

  it('descuento global de 20: total 180', () => {
    const result = calcularTotalesFactura(
      [{ cantidad: 2, precioUnitario: 100, itbisPorcentaje: 0, descuento: 0 }],
      20,
    );
    expect(result.subtotal).toBe(200);
    expect(result.descuento).toBe(20);
    expect(result.total).toBe(180);
  });

  it('múltiples items mixtos', () => {
    const result = calcularTotalesFactura([
      { cantidad: 2, precioUnitario: 50, itbisPorcentaje: 18, descuento: 0 },
      { cantidad: 1, precioUnitario: 200, itbisPorcentaje: 0, descuento: 0 },
    ]);
    // Item 1: subtotal=100, itbis=18, total=118
    // Item 2: subtotal=200, itbis=0, total=200
    expect(result.subtotal).toBe(300);
    expect(result.itbis).toBe(18);
    expect(result.total).toBe(318);
    expect(result.items).toHaveLength(2);
  });

  it('descuento por item', () => {
    const result = calcularTotalesFactura([
      { cantidad: 1, precioUnitario: 100, itbisPorcentaje: 0, descuento: 10 },
    ]);
    // subtotal=100, itbis=0, total=100-10=90
    expect(result.items[0]?.total).toBe(90);
    expect(result.subtotal).toBe(100);
    expect(result.total).toBe(90);
  });

  it('sin error de punto flotante: 2.1 × precio que produzca 4.30', () => {
    // 2 × 1.05 = 2.10, 2 × 1.15 = 2.30... let's use values that produce 4.30
    // 1 × 2.10 + 1 × 2.20 = 4.30 subtotal
    const result = calcularTotalesFactura([
      { cantidad: 1, precioUnitario: 2.1, itbisPorcentaje: 0, descuento: 0 },
      { cantidad: 1, precioUnitario: 2.2, itbisPorcentaje: 0, descuento: 0 },
    ]);
    // Without rounding: 2.1 + 2.2 = 4.300000000000001 in JS
    expect(result.subtotal).toBe(4.3);
    expect(result.total).toBe(4.3);
  });

  it('retorna lista de items calculados con la misma longitud', () => {
    const items = [
      { cantidad: 3, precioUnitario: 10, itbisPorcentaje: 18, descuento: 0 },
      { cantidad: 1, precioUnitario: 50, itbisPorcentaje: 0, descuento: 5 },
    ];
    const result = calcularTotalesFactura(items);
    expect(result.items).toHaveLength(2);
  });

  it('array vacío retorna ceros', () => {
    const result = calcularTotalesFactura([]);
    expect(result.subtotal).toBe(0);
    expect(result.itbis).toBe(0);
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });
});
