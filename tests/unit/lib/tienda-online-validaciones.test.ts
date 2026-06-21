import { describe, it, expect } from 'vitest';
import {
  itemPedidoOnlineSchema,
  crearPedidoOnlineSchema,
  actualizarPedidoOnlineSchema,
  facturarPedidoOnlineSchema,
} from '@/lib/validations/tienda-online';

const baseItem = {
  descripcion: 'Camisa azul talla M',
  cantidad: 2,
  precioUnitario: 1200,
};

describe('itemPedidoOnlineSchema', () => {
  it('acepta ítem válido', () => {
    const result = itemPedidoOnlineSchema.safeParse(baseItem);
    expect(result.success).toBe(true);
  });

  it('acepta productoId opcional', () => {
    const result = itemPedidoOnlineSchema.safeParse({
      ...baseItem,
      productoId: 'clproducto0000000000000001',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza descripción vacía', () => {
    const result = itemPedidoOnlineSchema.safeParse({ ...baseItem, descripcion: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza cantidad 0', () => {
    const result = itemPedidoOnlineSchema.safeParse({ ...baseItem, cantidad: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza precio 0', () => {
    const result = itemPedidoOnlineSchema.safeParse({ ...baseItem, precioUnitario: 0 });
    expect(result.success).toBe(false);
  });

  it('convierte strings numéricos con coerce', () => {
    const result = itemPedidoOnlineSchema.safeParse({
      ...baseItem,
      cantidad: '3',
      precioUnitario: '800',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cantidad).toBe(3);
      expect(result.data.precioUnitario).toBe(800);
    }
  });
});

const basePedido = {
  clienteNombre: 'María González',
  items: [baseItem],
};

describe('crearPedidoOnlineSchema', () => {
  it('acepta pedido mínimo válido', () => {
    const result = crearPedidoOnlineSchema.safeParse(basePedido);
    expect(result.success).toBe(true);
  });

  it('canal por defecto es WHATSAPP', () => {
    const result = crearPedidoOnlineSchema.safeParse(basePedido);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.canal).toBe('WHATSAPP');
  });

  it('acepta todos los canales válidos', () => {
    for (const canal of ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'OTRO']) {
      const result = crearPedidoOnlineSchema.safeParse({ ...basePedido, canal });
      expect(result.success).toBe(true);
    }
  });

  it('rechaza canal inválido', () => {
    const result = crearPedidoOnlineSchema.safeParse({ ...basePedido, canal: 'TIKTOK' });
    expect(result.success).toBe(false);
  });

  it('rechaza clienteNombre vacío', () => {
    const result = crearPedidoOnlineSchema.safeParse({ ...basePedido, clienteNombre: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza array de items vacío', () => {
    const result = crearPedidoOnlineSchema.safeParse({ ...basePedido, items: [] });
    expect(result.success).toBe(false);
  });

  it('acepta metodoPago opcional', () => {
    const result = crearPedidoOnlineSchema.safeParse({
      ...basePedido,
      metodoPago: 'TRANSFERENCIA',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza metodoPago inválido', () => {
    const result = crearPedidoOnlineSchema.safeParse({
      ...basePedido,
      metodoPago: 'CRIPTO',
    });
    expect(result.success).toBe(false);
  });

  it('acepta múltiples ítems', () => {
    const result = crearPedidoOnlineSchema.safeParse({
      ...basePedido,
      items: [baseItem, { descripcion: 'Pantalón negro', cantidad: 1, precioUnitario: 2000 }],
    });
    expect(result.success).toBe(true);
  });
});

describe('actualizarPedidoOnlineSchema', () => {
  it('acepta patch vacío', () => {
    const result = actualizarPedidoOnlineSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('acepta todos los estados válidos', () => {
    for (const estado of [
      'PENDIENTE',
      'CONFIRMADO',
      'PREPARANDO',
      'ENVIADO',
      'ENTREGADO',
      'CANCELADO',
    ]) {
      const result = actualizarPedidoOnlineSchema.safeParse({ estado });
      expect(result.success).toBe(true);
    }
  });

  it('rechaza estado inválido', () => {
    const result = actualizarPedidoOnlineSchema.safeParse({ estado: 'OTRO' });
    expect(result.success).toBe(false);
  });

  it('acepta tracking null', () => {
    const result = actualizarPedidoOnlineSchema.safeParse({ tracking: null });
    expect(result.success).toBe(true);
  });

  it('rechaza tracking demasiado largo', () => {
    const result = actualizarPedidoOnlineSchema.safeParse({ tracking: 'X'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('facturarPedidoOnlineSchema', () => {
  it('acepta todos los métodos válidos', () => {
    for (const metodoPago of ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO']) {
      const result = facturarPedidoOnlineSchema.safeParse({ metodoPago });
      expect(result.success).toBe(true);
    }
  });

  it('rechaza sin metodoPago', () => {
    const result = facturarPedidoOnlineSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rechaza método inválido', () => {
    const result = facturarPedidoOnlineSchema.safeParse({ metodoPago: 'BITCOIN' });
    expect(result.success).toBe(false);
  });
});
