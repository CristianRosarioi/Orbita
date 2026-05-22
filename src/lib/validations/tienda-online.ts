import { z } from 'zod';

export const itemPedidoOnlineSchema = z.object({
  productoId: z.string().cuid().optional(),
  descripcion: z.string().min(1, 'La descripción es requerida').max(300),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.coerce.number().positive('El precio debe ser mayor a 0'),
});

export const crearPedidoOnlineSchema = z.object({
  clienteId: z.string().cuid().optional(),
  clienteNombre: z.string().min(1, 'El nombre del cliente es requerido').max(200),
  clienteTelefono: z.string().max(20).optional(),
  canal: z.enum(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'OTRO']).default('WHATSAPP'),
  direccionEntrega: z.string().max(500).optional(),
  notas: z.string().max(1000).optional(),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']).optional(),
  items: z.array(itemPedidoOnlineSchema).min(1, 'El pedido debe tener al menos un ítem'),
});

export const actualizarPedidoOnlineSchema = z.object({
  estado: z
    .enum(['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'])
    .optional(),
  tracking: z.string().max(200).optional().nullable(),
  notas: z.string().max(1000).optional().nullable(),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']).optional(),
  direccionEntrega: z.string().max(500).optional().nullable(),
});

export const facturarPedidoOnlineSchema = z.object({
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO']),
});

export type CrearPedidoOnlineInput = z.infer<typeof crearPedidoOnlineSchema>;
export type ActualizarPedidoOnlineInput = z.infer<typeof actualizarPedidoOnlineSchema>;
export type ItemPedidoOnlineInput = z.infer<typeof itemPedidoOnlineSchema>;
