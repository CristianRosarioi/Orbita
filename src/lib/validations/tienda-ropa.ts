import { z } from 'zod';

export const crearVarianteSchema = z.object({
  productoId: z.string().cuid('ID de producto inválido'),
  talla: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  sku: z.string().max(100).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  precio: z.coerce.number().positive().optional(),
});

export const actualizarVarianteSchema = z.object({
  talla: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  sku: z.string().max(100).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  precio: z.coerce.number().positive().optional().nullable(),
  activa: z.boolean().optional(),
});

export const crearDevolucionSchema = z.object({
  facturaId: z.string().cuid('ID de factura inválido'),
  clienteId: z.string().cuid().optional(),
  motivo: z.string().min(1, 'El motivo es requerido').max(500),
  tipo: z.enum(['DEVOLUCION', 'INTERCAMBIO']).default('DEVOLUCION'),
  montoCredito: z.coerce.number().positive().optional(),
  notas: z.string().max(1000).optional(),
});

export const actualizarDevolucionSchema = z.object({
  estado: z.enum(['PENDIENTE', 'APROBADA', 'RECHAZADA', 'COMPLETADA']),
  notas: z.string().max(1000).optional(),
  montoCredito: z.coerce.number().positive().optional(),
});

export type CrearVarianteInput = z.infer<typeof crearVarianteSchema>;
export type ActualizarVarianteInput = z.infer<typeof actualizarVarianteSchema>;
export type CrearDevolucionInput = z.infer<typeof crearDevolucionSchema>;
export type ActualizarDevolucionInput = z.infer<typeof actualizarDevolucionSchema>;
