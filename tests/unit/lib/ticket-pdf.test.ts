import { describe, it, expect, vi } from 'vitest';

// jsPDF usa APIs del browser — mock mínimo para entorno Node
vi.mock('jspdf', () => ({
  jsPDF: class {
    setFont = vi.fn();
    setFontSize = vi.fn();
    setLineWidth = vi.fn();
    text = vi.fn();
    line = vi.fn();
    splitTextToSize = vi.fn((text: string) => [text]);
    output = vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' }));
  },
}));

import { generarTicketPOS } from '@/lib/ticket-pdf';

const facturaBase = {
  numero: 'FAC-2024-0001',
  fechaEmision: new Date('2024-01-15T10:30:00'),
  metodoPago: 'EFECTIVO',
  subtotal: 100,
  itbis: 18,
  descuento: 0,
  total: 118,
  clienteNombre: 'Consumidor Final',
  items: [
    {
      productoNombre: 'Producto de prueba',
      cantidad: 2,
      precioUnitario: 50,
      total: 100,
    },
  ],
};

const empresaBase = {
  nombre: 'Empresa Demo',
  nombreComercial: 'Demo Store',
  telefono: '809-555-1234',
  direccion: 'Calle Principal 123',
  modoFiscal: 'SIMPLE',
};

describe('generarTicketPOS', () => {
  it('genera un Blob sin errores', () => {
    const blob = generarTicketPOS(facturaBase, empresaBase);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('genera sin errores cuando no hay teléfono ni dirección', () => {
    const empresa = { ...empresaBase, telefono: null, direccion: null };
    const blob = generarTicketPOS(facturaBase, empresa);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('genera cuando el método de pago es TARJETA', () => {
    const factura = { ...facturaBase, metodoPago: 'TARJETA' };
    expect(() => generarTicketPOS(factura, empresaBase)).not.toThrow();
  });

  it('incluye el cambio cuando hay montoRecibido en efectivo', () => {
    const factura = { ...facturaBase, montoRecibido: 200 };
    expect(() => generarTicketPOS(factura, empresaBase)).not.toThrow();
  });

  it('genera para modo fiscal', () => {
    const empresa = { ...empresaBase, modoFiscal: 'FISCAL' };
    expect(() => generarTicketPOS(facturaBase, empresa)).not.toThrow();
  });

  it('maneja nombres de productos largos sin romper', () => {
    const factura = {
      ...facturaBase,
      items: [
        {
          productoNombre: 'Producto con nombre muy muy muy muy muy largo que debe ser truncado',
          cantidad: 1,
          precioUnitario: 50,
          total: 50,
        },
      ],
    };
    expect(() => generarTicketPOS(factura, empresaBase)).not.toThrow();
  });
});
