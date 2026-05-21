import { describe, it, expect } from 'vitest';
import { crearOrdenCarwashSchema, actualizarOrdenCarwashSchema } from '@/lib/validations/carwash';

const baseOrden = {
  clienteNombre: 'Juan Pérez',
  vehiculoPlaca: 'A123456',
  tipoServicio: 'Lavado básico exterior',
  precio: 800,
};

describe('crearOrdenCarwashSchema', () => {
  it('acepta datos mínimos requeridos', () => {
    const result = crearOrdenCarwashSchema.safeParse(baseOrden);
    expect(result.success).toBe(true);
  });

  it('acepta todos los campos opcionales', () => {
    const result = crearOrdenCarwashSchema.safeParse({
      ...baseOrden,
      clienteTelefono: '829-555-0000',
      vehiculoMarca: 'Toyota',
      vehiculoModelo: 'Corolla',
      vehiculoColor: 'Rojo',
      duracionMin: 45,
      empleadoAsignado: 'Pedro',
      notas: 'Lavar motor también',
    });
    expect(result.success).toBe(true);
  });

  it('convierte la placa a mayúsculas', () => {
    const result = crearOrdenCarwashSchema.safeParse({ ...baseOrden, vehiculoPlaca: 'a123456' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.vehiculoPlaca).toBe('A123456');
  });

  it('rechaza clienteNombre vacío', () => {
    const result = crearOrdenCarwashSchema.safeParse({ ...baseOrden, clienteNombre: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza vehiculoPlaca vacía', () => {
    const result = crearOrdenCarwashSchema.safeParse({ ...baseOrden, vehiculoPlaca: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza precio de 0 o negativo', () => {
    expect(crearOrdenCarwashSchema.safeParse({ ...baseOrden, precio: 0 }).success).toBe(false);
    expect(crearOrdenCarwashSchema.safeParse({ ...baseOrden, precio: -100 }).success).toBe(false);
  });

  it('rechaza tipoServicio vacío', () => {
    const result = crearOrdenCarwashSchema.safeParse({ ...baseOrden, tipoServicio: '' });
    expect(result.success).toBe(false);
  });

  it('aplica duracionMin por defecto de 30', () => {
    const result = crearOrdenCarwashSchema.safeParse(baseOrden);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.duracionMin).toBe(30);
  });
});

describe('actualizarOrdenCarwashSchema', () => {
  it('acepta cambio de estado válido', () => {
    const result = actualizarOrdenCarwashSchema.safeParse({ estado: 'EN_PROCESO' });
    expect(result.success).toBe(true);
  });

  it('acepta todos los estados válidos', () => {
    const estados = ['EN_COLA', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO'];
    for (const estado of estados) {
      expect(actualizarOrdenCarwashSchema.safeParse({ estado }).success).toBe(true);
    }
  });

  it('rechaza estado inválido', () => {
    const result = actualizarOrdenCarwashSchema.safeParse({ estado: 'INVALIDO' });
    expect(result.success).toBe(false);
  });

  it('acepta actualización parcial sin estado', () => {
    const result = actualizarOrdenCarwashSchema.safeParse({ notas: 'Nueva nota' });
    expect(result.success).toBe(true);
  });

  it('acepta objeto vacío', () => {
    const result = actualizarOrdenCarwashSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
