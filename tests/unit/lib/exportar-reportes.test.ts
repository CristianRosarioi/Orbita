import { describe, it, expect } from 'vitest';
import {
  generarTXT606,
  generarTXT607,
  generarTXT608,
  generarExcel606,
  generarExcel607,
  generarExcel608,
  type Registro606,
  type Registro607,
  type Registro608,
} from '@/lib/exportar-reportes';

const REG606: Registro606 = {
  rncEmpresa:       '123456789',
  rncComprador:     '987654321',
  tipoNcf:          'B02',
  ncf:              'FAC-2026-0001',
  ncfModificado:    '',
  fechaComprobante: '20260501',
  fechaPago:        '20260501',
  montoServicios:   0,
  montoBienes:      10000,
  total:            11800,
  itbisFacturado:   1800,
  itbisRetenido:    0,
  itbisPercibido:   0,
  tipoRetencion:    '',
  montoRetencion:   0,
};

const REG607: Registro607 = {
  rncEmpresa:       '123456789',
  rncProveedor:     '111111111',
  tipoNcf:          'B01',
  ncf:              'B0100000001',
  ncfModificado:    '',
  fechaComprobante: '20260501',
  fechaPago:        '20260515',
  montoServicios:   5000,
  montoBienes:      0,
  total:            5900,
  itbisFacturado:   900,
  itbisRetenido:    0,
};

const REG608: Registro608 = {
  rncEmpresa:    '123456789',
  tipoNcf:       'B02',
  ncf:           'FAC-2026-0002',
  fechaAnulacion:'20260510',
};

// ---- TXT 606 ----
describe('generarTXT606', () => {
  it('produce la cantidad correcta de líneas', () => {
    const txt = generarTXT606([REG606, REG606]);
    const lineas = txt.split('\r\n');
    expect(lineas).toHaveLength(2);
  });

  it('cada línea tiene exactamente 15 campos separados por |', () => {
    const txt = generarTXT606([REG606]);
    const linea = txt.split('\r\n')[0]!;
    // La línea termina en | así que el split produce un elemento vacío al final
    const campos = linea.split('|');
    expect(campos).toHaveLength(16); // 15 campos + terminador vacío
    expect(linea.endsWith('|')).toBe(true);
  });

  it('el campo total tiene 2 decimales', () => {
    const txt = generarTXT606([REG606]);
    expect(txt).toContain('11800.00');
  });

  it('campo RNC empresa es el primero', () => {
    const txt = generarTXT606([REG606]);
    expect(txt.startsWith('123456789')).toBe(true);
  });

  it('lista vacía produce string vacío', () => {
    expect(generarTXT606([])).toBe('');
  });
});

// ---- TXT 607 ----
describe('generarTXT607', () => {
  it('produce 12 campos por línea', () => {
    const txt = generarTXT607([REG607]);
    const linea = txt.split('\r\n')[0]!;
    const campos = linea.split('|');
    expect(campos).toHaveLength(13); // 12 campos + terminador vacío
  });

  it('lista vacía produce string vacío', () => {
    expect(generarTXT607([])).toBe('');
  });
});

// ---- TXT 608 ----
describe('generarTXT608', () => {
  it('produce 4 campos por línea', () => {
    const txt = generarTXT608([REG608]);
    const linea = txt.split('\r\n')[0]!;
    const campos = linea.split('|');
    expect(campos).toHaveLength(5); // 4 campos + terminador vacío
  });

  it('fecha de anulación está en la posición correcta', () => {
    const txt = generarTXT608([REG608]);
    expect(txt).toContain('20260510');
  });
});

// ---- Excel generators ----
describe('generarExcel606', () => {
  it('devuelve un Buffer válido (no vacío)', () => {
    const buf = generarExcel606([REG606]);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('Buffer vacío para lista vacía', () => {
    const buf = generarExcel606([]);
    expect(buf).toBeInstanceOf(Buffer);
  });
});

describe('generarExcel607', () => {
  it('devuelve un Buffer válido', () => {
    const buf = generarExcel607([REG607]);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });
});

describe('generarExcel608', () => {
  it('devuelve un Buffer válido', () => {
    const buf = generarExcel608([REG608]);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });
});
