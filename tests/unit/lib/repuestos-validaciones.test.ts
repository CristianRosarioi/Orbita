import { describe, it, expect } from 'vitest';
import {
  crearRepuestoSchema,
  actualizarRepuestoSchema,
  crearCotizacionSchema,
  actualizarEstadoCotizacionSchema,
} from '@/lib/validations/repuestos';

const baseRepuesto = {
  codigo: 'REP-001',
  nombre: 'Filtro de aceite',
  precio: 650,
};

describe('crearRepuestoSchema', () => {
  it('acepta datos mínimos', () => {
    const result = crearRepuestoSchema.safeParse(baseRepuesto);
    expect(result.success).toBe(true);
  });

  it('convierte el código a mayúsculas', () => {
    const result = crearRepuestoSchema.safeParse({ ...baseRepuesto, codigo: 'rep-001' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.codigo).toBe('REP-001');
  });

  it('acepta todos los campos opcionales', () => {
    const result = crearRepuestoSchema.safeParse({
      ...baseRepuesto,
      descripcion: 'Filtro premium',
      marca: 'Bosch',
      marcaVehiculo: 'Toyota',
      modeloVehiculo: 'Corolla',
      anioDesde: 2010,
      anioHasta: 2024,
      precioMayor: 500,
      stock: 10,
      stockMinimo: 3,
      ubicacion: 'Estante A',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza código vacío', () => {
    const result = crearRepuestoSchema.safeParse({ ...baseRepuesto, codigo: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza nombre vacío', () => {
    const result = crearRepuestoSchema.safeParse({ ...baseRepuesto, nombre: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza precio de 0 o negativo', () => {
    expect(crearRepuestoSchema.safeParse({ ...baseRepuesto, precio: 0 }).success).toBe(false);
    expect(crearRepuestoSchema.safeParse({ ...baseRepuesto, precio: -50 }).success).toBe(false);
  });

  it('aplica stock y stockMinimo por defecto', () => {
    const result = crearRepuestoSchema.safeParse(baseRepuesto);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock).toBe(0);
      expect(result.data.stockMinimo).toBe(2);
    }
  });
});

describe('actualizarRepuestoSchema', () => {
  it('acepta actualización parcial', () => {
    expect(actualizarRepuestoSchema.safeParse({ precio: 700 }).success).toBe(true);
    expect(actualizarRepuestoSchema.safeParse({ stock: 5 }).success).toBe(true);
    expect(actualizarRepuestoSchema.safeParse({}).success).toBe(true);
  });
});

const baseCotizacion = {
  clienteNombre: 'María García',
  items: [
    { descripcion: 'Filtro de aceite', cantidad: 2, precioUnitario: 650, itbisPorcentaje: 18 },
  ],
};

describe('crearCotizacionSchema', () => {
  it('acepta datos mínimos', () => {
    const result = crearCotizacionSchema.safeParse(baseCotizacion);
    expect(result.success).toBe(true);
  });

  it('acepta múltiples ítems', () => {
    const result = crearCotizacionSchema.safeParse({
      ...baseCotizacion,
      items: [
        { descripcion: 'Filtro de aceite', cantidad: 1, precioUnitario: 650, itbisPorcentaje: 18 },
        { descripcion: 'Bujía NGK', cantidad: 4, precioUnitario: 250, itbisPorcentaje: 18 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rechaza sin ítems', () => {
    const result = crearCotizacionSchema.safeParse({ ...baseCotizacion, items: [] });
    expect(result.success).toBe(false);
  });

  it('rechaza ítem con cantidad de 0', () => {
    const result = crearCotizacionSchema.safeParse({
      ...baseCotizacion,
      items: [{ descripcion: 'Filtro', cantidad: 0, precioUnitario: 650, itbisPorcentaje: 18 }],
    });
    expect(result.success).toBe(false);
  });

  it('rechaza ítem con precio de 0', () => {
    const result = crearCotizacionSchema.safeParse({
      ...baseCotizacion,
      items: [{ descripcion: 'Filtro', cantidad: 1, precioUnitario: 0, itbisPorcentaje: 18 }],
    });
    expect(result.success).toBe(false);
  });

  it('rechaza clienteNombre vacío', () => {
    const result = crearCotizacionSchema.safeParse({ ...baseCotizacion, clienteNombre: '' });
    expect(result.success).toBe(false);
  });

  it('aplica itbisPorcentaje por defecto de 18', () => {
    const result = crearCotizacionSchema.safeParse({
      ...baseCotizacion,
      items: [{ descripcion: 'Filtro', cantidad: 1, precioUnitario: 650 }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.items[0]!.itbisPorcentaje).toBe(18);
  });
});

describe('actualizarEstadoCotizacionSchema', () => {
  it('acepta estados válidos', () => {
    const estados = ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'FACTURADA'];
    for (const estado of estados) {
      expect(actualizarEstadoCotizacionSchema.safeParse({ estado }).success).toBe(true);
    }
  });

  it('rechaza estado inválido', () => {
    const result = actualizarEstadoCotizacionSchema.safeParse({ estado: 'OTRO' });
    expect(result.success).toBe(false);
  });

  it('rechaza sin estado', () => {
    const result = actualizarEstadoCotizacionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
