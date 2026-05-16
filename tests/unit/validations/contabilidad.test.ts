import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Inline schemas que replican los usados en las API routes de contabilidad y reportes
const FiltrosAsientosSchema = z.object({
  page:   z.coerce.number().min(1).default(1),
  limit:  z.coerce.number().min(1).max(100).default(50),
  desde:  z.string().optional(),
  hasta:  z.string().optional(),
});

const FiltrosResultadosSchema = z.object({
  mes:  z.coerce.number().min(1).max(12).optional(),
  anio: z.coerce.number().min(2020).max(2100).optional(),
});

const FiltrosReporteSchema = z.object({
  mes:  z.coerce.number().min(1).max(12),
  anio: z.coerce.number().min(2020).max(2100),
});

const ExportarSchema = z.object({
  mes:     z.coerce.number().min(1).max(12),
  anio:    z.coerce.number().min(2020).max(2100),
  formato: z.enum(['txt', 'xlsx']).default('txt'),
});

describe('FiltrosAsientosSchema', () => {
  it('usa valores por defecto si no se pasan parámetros', () => {
    const r = FiltrosAsientosSchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(50);
  });

  it('coerce strings a números', () => {
    const r = FiltrosAsientosSchema.parse({ page: '2', limit: '10' });
    expect(r.page).toBe(2);
    expect(r.limit).toBe(10);
  });

  it('rechaza limit > 100', () => {
    const r = FiltrosAsientosSchema.safeParse({ limit: '200' });
    expect(r.success).toBe(false);
  });

  it('rechaza page < 1', () => {
    const r = FiltrosAsientosSchema.safeParse({ page: '0' });
    expect(r.success).toBe(false);
  });

  it('acepta filtros de fecha opcionales', () => {
    const r = FiltrosAsientosSchema.parse({ desde: '2026-01-01', hasta: '2026-01-31' });
    expect(r.desde).toBe('2026-01-01');
    expect(r.hasta).toBe('2026-01-31');
  });
});

describe('FiltrosResultadosSchema', () => {
  it('acepta mes y año opcionales', () => {
    const r = FiltrosResultadosSchema.parse({ mes: '5', anio: '2026' });
    expect(r.mes).toBe(5);
    expect(r.anio).toBe(2026);
  });

  it('rechaza mes fuera de rango', () => {
    expect(FiltrosResultadosSchema.safeParse({ mes: '13' }).success).toBe(false);
    expect(FiltrosResultadosSchema.safeParse({ mes: '0' }).success).toBe(false);
  });

  it('rechaza año fuera de rango', () => {
    expect(FiltrosResultadosSchema.safeParse({ anio: '2019' }).success).toBe(false);
    expect(FiltrosResultadosSchema.safeParse({ anio: '2101' }).success).toBe(false);
  });
});

describe('FiltrosReporteSchema (606/608)', () => {
  it('requiere mes y año', () => {
    expect(FiltrosReporteSchema.safeParse({}).success).toBe(false);
    expect(FiltrosReporteSchema.safeParse({ mes: '5' }).success).toBe(false);
    expect(FiltrosReporteSchema.safeParse({ anio: '2026' }).success).toBe(false);
  });

  it('parsea correctamente mes y año válidos', () => {
    const r = FiltrosReporteSchema.parse({ mes: '5', anio: '2026' });
    expect(r.mes).toBe(5);
    expect(r.anio).toBe(2026);
  });
});

describe('ExportarSchema', () => {
  it('formato por defecto es txt', () => {
    const r = ExportarSchema.parse({ mes: '5', anio: '2026' });
    expect(r.formato).toBe('txt');
  });

  it('acepta formato xlsx', () => {
    const r = ExportarSchema.parse({ mes: '5', anio: '2026', formato: 'xlsx' });
    expect(r.formato).toBe('xlsx');
  });

  it('rechaza formato desconocido', () => {
    const r = ExportarSchema.safeParse({ mes: '5', anio: '2026', formato: 'csv' });
    expect(r.success).toBe(false);
  });
});
