import { z } from 'zod';

export const CreatePedidoSchema = z.object({
  proveedorId: z.string().min(1, 'El proveedor es requerido'),
  fechaEntrega: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Fecha inválida')
    .optional(),
  notas: z.string().max(1000).optional(),
});

export type CreatePedidoInput = z.infer<typeof CreatePedidoSchema>;

export const UpdatePedidoSchema = z.object({
  estado: z.enum(['BORRADOR', 'ENVIADO', 'CONFIRMADO', 'RECIBIDO', 'CANCELADO']).optional(),
  fechaEntrega: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Fecha inválida')
    .optional(),
  notas: z.string().max(1000).optional(),
});

export type UpdatePedidoInput = z.infer<typeof UpdatePedidoSchema>;

export const AddItemPedidoSchema = z.object({
  productoId: z.string().optional(),
  descripcion: z.string().min(1, 'La descripción es requerida').max(200),
  unidadMedida: z.string().max(30).default('und'),
  cantidad: z.number().positive('La cantidad debe ser mayor que cero'),
  precioUnitario: z.number().positive('El precio debe ser mayor que cero'),
});

export type AddItemPedidoInput = z.infer<typeof AddItemPedidoSchema>;
