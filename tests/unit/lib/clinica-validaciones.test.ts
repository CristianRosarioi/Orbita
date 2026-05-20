import { describe, it, expect } from 'vitest';
import {
  CreatePacienteSchema,
  UpdatePacienteSchema,
  CreateConsultaSchema,
  UpdateConsultaSchema,
} from '@/lib/validations/clinica';

describe('CreatePacienteSchema', () => {
  it('acepta datos mínimos válidos', () => {
    const resultado = CreatePacienteSchema.safeParse({ nombre: 'Juan', apellido: 'Pérez' });
    expect(resultado.success).toBe(true);
  });

  it('requiere nombre', () => {
    const resultado = CreatePacienteSchema.safeParse({ apellido: 'Pérez' });
    expect(resultado.success).toBe(false);
  });

  it('requiere apellido', () => {
    const resultado = CreatePacienteSchema.safeParse({ nombre: 'Juan' });
    expect(resultado.success).toBe(false);
  });

  it('valida cédula de 11 dígitos', () => {
    const valida = CreatePacienteSchema.safeParse({
      nombre: 'J',
      apellido: 'P',
      cedula: '00100123456',
    });
    expect(valida.success).toBe(true);
  });

  it('rechaza cédula con menos de 11 dígitos', () => {
    const resultado = CreatePacienteSchema.safeParse({
      nombre: 'J',
      apellido: 'P',
      cedula: '12345',
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza cédula con letras', () => {
    const resultado = CreatePacienteSchema.safeParse({
      nombre: 'J',
      apellido: 'P',
      cedula: '0010012345A',
    });
    expect(resultado.success).toBe(false);
  });

  it('acepta cédula vacía (campo opcional)', () => {
    const resultado = CreatePacienteSchema.safeParse({ nombre: 'J', apellido: 'P', cedula: '' });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.cedula).toBeUndefined();
  });

  it('acepta tipos de sangre válidos', () => {
    const tipos = ['A_POSITIVO', 'O_NEGATIVO', 'AB_POSITIVO', 'DESCONOCIDO'];
    for (const tipoSangre of tipos) {
      const r = CreatePacienteSchema.safeParse({ nombre: 'J', apellido: 'P', tipoSangre });
      expect(r.success).toBe(true);
    }
  });

  it('rechaza tipo de sangre inválido', () => {
    const resultado = CreatePacienteSchema.safeParse({
      nombre: 'J',
      apellido: 'P',
      tipoSangre: 'X_NEGATIVO',
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza email inválido', () => {
    const resultado = CreatePacienteSchema.safeParse({
      nombre: 'J',
      apellido: 'P',
      email: 'no-es-email',
    });
    expect(resultado.success).toBe(false);
  });

  it('convierte email vacío a undefined', () => {
    const resultado = CreatePacienteSchema.safeParse({ nombre: 'J', apellido: 'P', email: '' });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.email).toBeUndefined();
  });
});

describe('UpdatePacienteSchema', () => {
  it('acepta todos los campos opcionales', () => {
    const resultado = UpdatePacienteSchema.safeParse({});
    expect(resultado.success).toBe(true);
  });

  it('acepta cambio de estado', () => {
    const resultado = UpdatePacienteSchema.safeParse({ estado: 'ARCHIVADO' });
    expect(resultado.success).toBe(true);
  });

  it('rechaza estado inválido', () => {
    const resultado = UpdatePacienteSchema.safeParse({ estado: 'ELIMINADO' });
    expect(resultado.success).toBe(false);
  });
});

describe('CreateConsultaSchema', () => {
  const fechaValida = new Date().toISOString();

  it('acepta datos mínimos válidos', () => {
    const resultado = CreateConsultaSchema.safeParse({
      pacienteId: 'pac123',
      medicoNombre: 'Dr. García',
      fechaHora: fechaValida,
    });
    expect(resultado.success).toBe(true);
  });

  it('requiere pacienteId', () => {
    const resultado = CreateConsultaSchema.safeParse({
      medicoNombre: 'Dr. García',
      fechaHora: fechaValida,
    });
    expect(resultado.success).toBe(false);
  });

  it('requiere medicoNombre', () => {
    const resultado = CreateConsultaSchema.safeParse({ pacienteId: 'p1', fechaHora: fechaValida });
    expect(resultado.success).toBe(false);
  });

  it('convierte peso a número', () => {
    const resultado = CreateConsultaSchema.safeParse({
      pacienteId: 'p1',
      medicoNombre: 'Dr. G',
      fechaHora: fechaValida,
      peso: '75.5',
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(typeof resultado.data.peso).toBe('number');
  });

  it('rechaza peso negativo', () => {
    const resultado = CreateConsultaSchema.safeParse({
      pacienteId: 'p1',
      medicoNombre: 'Dr. G',
      fechaHora: fechaValida,
      peso: -5,
    });
    expect(resultado.success).toBe(false);
  });

  it('acepta precio 0', () => {
    const resultado = CreateConsultaSchema.safeParse({
      pacienteId: 'p1',
      medicoNombre: 'Dr. G',
      fechaHora: fechaValida,
      precio: 0,
    });
    expect(resultado.success).toBe(true);
  });

  it('rechaza precio negativo', () => {
    const resultado = CreateConsultaSchema.safeParse({
      pacienteId: 'p1',
      medicoNombre: 'Dr. G',
      fechaHora: fechaValida,
      precio: -100,
    });
    expect(resultado.success).toBe(false);
  });
});

describe('UpdateConsultaSchema', () => {
  it('acepta todos los campos opcionales', () => {
    const resultado = UpdateConsultaSchema.safeParse({});
    expect(resultado.success).toBe(true);
  });

  it('acepta estados válidos', () => {
    const estados = ['PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'];
    for (const estado of estados) {
      const r = UpdateConsultaSchema.safeParse({ estado });
      expect(r.success).toBe(true);
    }
  });

  it('rechaza estado inválido', () => {
    const resultado = UpdateConsultaSchema.safeParse({ estado: 'ELIMINADA' });
    expect(resultado.success).toBe(false);
  });
});
