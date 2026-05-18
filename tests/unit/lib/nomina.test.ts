import { describe, it, expect } from 'vitest';
import {
  calcularItemNomina,
  calcularNomina,
  TASA_TSS_TRABAJADOR,
  TASA_TSS_EMPLEADOR,
} from '@/lib/nomina';

describe('calcularItemNomina', () => {
  it('calcula TSS trabajador correctamente para salario bajo el tope', () => {
    const resultado = calcularItemNomina({ salarioBase: 30_000 });
    expect(resultado.tssTrabajador).toBeCloseTo(30_000 * TASA_TSS_TRABAJADOR, 1);
  });

  it('calcula TSS empleador correctamente', () => {
    const resultado = calcularItemNomina({ salarioBase: 30_000 });
    expect(resultado.tssEmpleador).toBeCloseTo(30_000 * TASA_TSS_EMPLEADOR, 1);
  });

  it('aplica el tope TSS para salarios altos', () => {
    const resultado = calcularItemNomina({ salarioBase: 200_000 });
    // TSS se calcula sobre 118,656 (tope mensual)
    expect(resultado.tssTrabajador).toBeCloseTo(118_656 * TASA_TSS_TRABAJADOR, 1);
  });

  it('empleado exento de ISR si salario anual < RD$ 416,220', () => {
    // Salario mensual ~RD$ 34,000 → anual ~408,000 → exento
    const resultado = calcularItemNomina({ salarioBase: 34_000 });
    expect(resultado.isr).toBe(0);
  });

  it('calcula ISR para salario en segundo tramo (15%)', () => {
    // Salario mensual ~RD$ 45,000 → anual bruto ~540,000
    // Base ISR anual ≈ 540,000 - TSS * 12 → aprox en segundo tramo
    const resultado = calcularItemNomina({ salarioBase: 45_000 });
    expect(resultado.isr).toBeGreaterThan(0);
  });

  it('calcula ISR para salario en tercer tramo (20%)', () => {
    const resultado = calcularItemNomina({ salarioBase: 65_000 });
    expect(resultado.isr).toBeGreaterThan(0);
  });

  it('calcula ISR para salario en cuarto tramo (25%)', () => {
    const resultado = calcularItemNomina({ salarioBase: 100_000 });
    expect(resultado.isr).toBeGreaterThan(0);
    const resultado65k = calcularItemNomina({ salarioBase: 65_000 });
    expect(resultado.isr).toBeGreaterThan(resultado65k.isr);
  });

  it('salario neto = bruto - TSS - ISR - descuentos', () => {
    const resultado = calcularItemNomina({
      salarioBase: 50_000,
      otrosDescuentos: 1_000,
    });
    const esperado =
      resultado.salarioBruto -
      resultado.tssTrabajador -
      resultado.isr -
      resultado.otrosDescuentos;
    expect(resultado.salarioNeto).toBeCloseTo(esperado, 1);
  });

  it('dias trabajados proporciona salario bruto correcto', () => {
    const completo = calcularItemNomina({ salarioBase: 30_000, diasTrabajados: 23.83 });
    const parcial = calcularItemNomina({ salarioBase: 30_000, diasTrabajados: 11.915 });
    expect(parcial.salarioBruto).toBeCloseTo(completo.salarioBruto / 2, 0);
  });

  it('incluye otros ingresos en el salario bruto', () => {
    const conBonus = calcularItemNomina({ salarioBase: 30_000, otrosIngresos: 5_000 });
    const sinBonus = calcularItemNomina({ salarioBase: 30_000 });
    expect(conBonus.salarioBruto).toBeCloseTo(sinBonus.salarioBruto + 5_000, 1);
  });

  it('retorna salarioBase y diasTrabajados en el resultado', () => {
    const resultado = calcularItemNomina({ salarioBase: 30_000, diasTrabajados: 20 });
    expect(resultado.salarioBase).toBe(30_000);
    expect(resultado.diasTrabajados).toBe(20);
  });
});

describe('calcularNomina', () => {
  it('suma correctamente todos los totales', () => {
    const items = [
      calcularItemNomina({ salarioBase: 30_000 }),
      calcularItemNomina({ salarioBase: 45_000 }),
    ];
    const resumen = calcularNomina(items);
    expect(resumen.totalBruto).toBeCloseTo(items[0].salarioBruto + items[1].salarioBruto, 1);
    expect(resumen.totalTSS).toBeCloseTo(items[0].tssTrabajador + items[1].tssTrabajador, 1);
    expect(resumen.totalNeto).toBeCloseTo(items[0].salarioNeto + items[1].salarioNeto, 1);
  });

  it('retorna ceros para lista vacía', () => {
    const resumen = calcularNomina([]);
    expect(resumen.totalBruto).toBe(0);
    expect(resumen.totalNeto).toBe(0);
  });
});
