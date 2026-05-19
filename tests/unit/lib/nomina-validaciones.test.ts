import { describe, it, expect } from 'vitest';
import { CreateEmpleadoSchema, CreateNominaSchema } from '@/lib/validations/nomina';

const empleadoValido = {
  nombre: 'Juan',
  apellido: 'Pérez',
  cedula: '00113456789',
  cargo: 'Vendedor',
  salarioBase: 25_000,
  tipoContrato: 'INDEFINIDO',
  frecuenciaPago: 'MENSUAL',
  fechaIngreso: '2026-01-15',
};

describe('CreateEmpleadoSchema', () => {
  it('acepta datos válidos', () => {
    const result = CreateEmpleadoSchema.safeParse(empleadoValido);
    expect(result.success).toBe(true);
  });

  it('rechaza cédula con menos de 11 dígitos', () => {
    const result = CreateEmpleadoSchema.safeParse({ ...empleadoValido, cedula: '001134567' });
    expect(result.success).toBe(false);
  });

  it('rechaza cédula con letras', () => {
    const result = CreateEmpleadoSchema.safeParse({ ...empleadoValido, cedula: '0011345678A' });
    expect(result.success).toBe(false);
  });

  it('rechaza salario cero', () => {
    const result = CreateEmpleadoSchema.safeParse({ ...empleadoValido, salarioBase: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza salario negativo', () => {
    const result = CreateEmpleadoSchema.safeParse({ ...empleadoValido, salarioBase: -1000 });
    expect(result.success).toBe(false);
  });

  it('rechaza tipoContrato inválido', () => {
    const result = CreateEmpleadoSchema.safeParse({ ...empleadoValido, tipoContrato: 'OTRO' });
    expect(result.success).toBe(false);
  });

  it('rechaza frecuenciaPago inválida', () => {
    const result = CreateEmpleadoSchema.safeParse({ ...empleadoValido, frecuenciaPago: 'DIARIO' });
    expect(result.success).toBe(false);
  });

  it('rechaza fecha inválida', () => {
    const result = CreateEmpleadoSchema.safeParse({
      ...empleadoValido,
      fechaIngreso: 'no-es-fecha',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza email inválido', () => {
    const result = CreateEmpleadoSchema.safeParse({ ...empleadoValido, email: 'no-es-email' });
    expect(result.success).toBe(false);
  });

  it('acepta email vacío (opcional)', () => {
    const result = CreateEmpleadoSchema.safeParse({ ...empleadoValido, email: '' });
    expect(result.success).toBe(true);
  });

  it('acepta sin campos opcionales', () => {
    const result = CreateEmpleadoSchema.safeParse({
      nombre: 'Ana',
      apellido: 'García',
      cedula: '00113456790',
      cargo: 'Cajera',
      salarioBase: 18_000,
      tipoContrato: 'TEMPORAL',
      frecuenciaPago: 'QUINCENAL',
      fechaIngreso: '2026-03-01',
    });
    expect(result.success).toBe(true);
  });
});

describe('CreateNominaSchema', () => {
  const nominaValida = {
    periodo: 'Mayo 2026',
    fechaInicio: '2026-05-01',
    fechaFin: '2026-05-31',
    items: [{ empleadoId: 'emp_1' }],
  };

  it('acepta datos válidos', () => {
    const result = CreateNominaSchema.safeParse(nominaValida);
    expect(result.success).toBe(true);
  });

  it('rechaza si items está vacío', () => {
    const result = CreateNominaSchema.safeParse({ ...nominaValida, items: [] });
    expect(result.success).toBe(false);
  });

  it('rechaza fechas inválidas', () => {
    const result = CreateNominaSchema.safeParse({ ...nominaValida, fechaInicio: 'no-es-fecha' });
    expect(result.success).toBe(false);
  });

  it('acepta items con diasTrabajados y descuentos', () => {
    const result = CreateNominaSchema.safeParse({
      ...nominaValida,
      items: [
        {
          empleadoId: 'emp_1',
          diasTrabajados: 20,
          otrosIngresos: 2000,
          otrosDescuentos: 500,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rechaza periodo vacío', () => {
    const result = CreateNominaSchema.safeParse({ ...nominaValida, periodo: '' });
    expect(result.success).toBe(false);
  });
});
