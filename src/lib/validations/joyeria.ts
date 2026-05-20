import { z } from 'zod';

export const CrearPiezaSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(20),
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  tipo: z.string().min(1, 'El tipo es requerido'),
  material: z.enum(['ORO_18K', 'ORO_14K', 'ORO_10K', 'PLATA_925', 'PLATINO', 'OTRO']),
  pesoGramos: z.coerce.number().positive().optional(),
  quilates: z.coerce.number().positive().optional(),
  precioCompra: z.coerce.number().positive().optional(),
  precioVenta: z.coerce.number().positive('El precio de venta debe ser mayor que 0'),
  descripcion: z.string().optional(),
  notas: z.string().optional(),
  clienteId: z.string().optional(),
});

export const ActualizarPiezaSchema = CrearPiezaSchema.partial().extend({
  estado: z
    .enum(['EN_VITRINA', 'VENDIDA', 'EN_REPARACION', 'RESERVADA', 'CONSIGNACION'])
    .optional(),
});

export const CrearReparacionSchema = z.object({
  piezaId: z.string().optional(),
  clienteId: z.string().optional(),
  clienteNombre: z.string().min(1, 'El nombre del cliente es requerido'),
  descripcion: z.string().min(1, 'La descripción del trabajo es requerida'),
  diagnostico: z.string().optional(),
  presupuesto: z.coerce.number().positive().optional(),
  fechaPromesa: z.coerce.date().optional(),
});

export const ActualizarReparacionSchema = z.object({
  diagnostico: z.string().optional(),
  presupuesto: z.coerce.number().positive().optional(),
  costoFinal: z.coerce.number().positive().optional(),
  estado: z.enum(['RECIBIDA', 'EN_PROCESO', 'LISTA', 'ENTREGADA']).optional(),
  fechaPromesa: z.coerce.date().optional(),
  fechaEntrega: z.coerce.date().optional(),
  notas: z.string().optional(),
});

export type CrearPiezaInput = z.infer<typeof CrearPiezaSchema>;
export type ActualizarPiezaInput = z.infer<typeof ActualizarPiezaSchema>;
export type CrearReparacionInput = z.infer<typeof CrearReparacionSchema>;
export type ActualizarReparacionInput = z.infer<typeof ActualizarReparacionSchema>;
