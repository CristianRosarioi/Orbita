import { z } from 'zod';

export const CreateLoteSchema = z.object({
  productoId: z.string().min(1, 'El producto es requerido'),
  numeroLote: z.string().min(1, 'El número de lote es requerido').max(100),
  fechaVencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Fecha de vencimiento inválida'),
  cantidadInicial: z.number().positive('La cantidad debe ser mayor que cero'),
  precioCompra: z.number().positive().optional(),
  proveedor: z.string().max(150).optional(),
  notas: z.string().max(500).optional(),
});

export type CreateLoteInput = z.infer<typeof CreateLoteSchema>;

export const UpdateLoteSchema = z.object({
  cantidadActual: z.number().min(0, 'La cantidad no puede ser negativa').optional(),
  precioCompra: z.number().positive().optional(),
  proveedor: z.string().max(150).optional(),
  notas: z.string().max(500).optional(),
  activo: z.boolean().optional(),
});

export type UpdateLoteInput = z.infer<typeof UpdateLoteSchema>;
