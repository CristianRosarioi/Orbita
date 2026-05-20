import { describe, it, expect } from 'vitest';
import { renderTemplate } from '@/lib/notificaciones';

describe('renderTemplate — FACTURA_EMITIDA', () => {
  it('reemplaza todos los placeholders', () => {
    const msg = renderTemplate('FACTURA_EMITIDA', {
      nombre: 'Juan Pérez',
      numero: 'F-0001',
      total: '5,000.00',
      empresa: 'Colmado El Buen Precio',
    });
    expect(msg).toContain('Juan Pérez');
    expect(msg).toContain('F-0001');
    expect(msg).toContain('5,000.00');
    expect(msg).toContain('Colmado El Buen Precio');
  });

  it('usa fallbacks cuando faltan datos', () => {
    const msg = renderTemplate('FACTURA_EMITIDA', {});
    expect(msg).toContain('cliente');
    expect(msg).toContain('-');
    expect(msg).toContain('nuestra empresa');
  });
});

describe('renderTemplate — FACTURA_VENCIDA', () => {
  it('incluye número, total, empresa y teléfono', () => {
    const msg = renderTemplate('FACTURA_VENCIDA', {
      nombre: 'María García',
      numero: 'F-0042',
      total: '12,500.00',
      empresa: 'Tech RD',
      telefono: '8095551234',
    });
    expect(msg).toContain('María García');
    expect(msg).toContain('F-0042');
    expect(msg).toContain('12,500.00');
    expect(msg).toContain('Tech RD');
    expect(msg).toContain('8095551234');
  });
});

describe('renderTemplate — PAGO_RECIBIDO', () => {
  it('incluye monto y número de factura', () => {
    const msg = renderTemplate('PAGO_RECIBIDO', {
      nombre: 'Pedro López',
      monto: '2,500.00',
      numero: 'F-0010',
      empresa: 'Salón Bella',
    });
    expect(msg).toContain('Pedro López');
    expect(msg).toContain('2,500.00');
    expect(msg).toContain('F-0010');
    expect(msg).toContain('Salón Bella');
  });
});

describe('renderTemplate — CITA_RECORDATORIO', () => {
  it('incluye fecha, hora, empresa y teléfono', () => {
    const msg = renderTemplate('CITA_RECORDATORIO', {
      nombre: 'Ana Reyes',
      fecha: '21 mayo 2026',
      hora: '10:00 AM',
      empresa: 'Clínica San Pedro',
      telefono: '8095559999',
    });
    expect(msg).toContain('Ana Reyes');
    expect(msg).toContain('21 mayo 2026');
    expect(msg).toContain('10:00 AM');
    expect(msg).toContain('Clínica San Pedro');
    expect(msg).toContain('8095559999');
  });

  it('usa fallbacks para valores faltantes', () => {
    const msg = renderTemplate('CITA_RECORDATORIO', {});
    expect(msg).toContain('cliente');
    expect(msg).toContain('-');
  });
});

describe('renderTemplate — STOCK_BAJO', () => {
  it('incluye nombre del producto y cantidad', () => {
    const msg = renderTemplate('STOCK_BAJO', {
      producto: 'Yogur Griego 500ml',
      cantidad: '3',
      empresa: 'Super Express',
    });
    expect(msg).toContain('Yogur Griego 500ml');
    expect(msg).toContain('3');
    expect(msg).toContain('Super Express');
  });
});

describe('renderTemplate — NOMINA_PROCESADA', () => {
  it('menciona la empresa', () => {
    const msg = renderTemplate('NOMINA_PROCESADA', { empresa: 'Distribuidora Rápida' });
    expect(msg).toContain('Distribuidora Rápida');
  });
});

describe('renderTemplate — BIENVENIDA', () => {
  it('incluye nombre y empresa', () => {
    const msg = renderTemplate('BIENVENIDA', { nombre: 'Carlos', empresa: 'Órbita Demo' });
    expect(msg).toContain('Carlos');
    expect(msg).toContain('Órbita Demo');
  });
});
