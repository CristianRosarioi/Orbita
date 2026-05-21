import { z } from 'zod';

export const crearOrdenCarwashSchema = z.object({
  clienteId: z.string().cuid().optional(),
  clienteNombre: z.string().min(1, 'El nombre es requerido').max(200),
  clienteTelefono: z.string().max(20).optional(),
  vehiculoPlaca: z.string().min(1, 'La placa es requerida').max(20).transform((v) => v.toUpperCase()),
  vehiculoMarca: z.string().max(100).optional(),
  vehiculoModelo: z.string().max(100).optional(),
  vehiculoColor: z.string().max(50).optional(),
  tipoServicio: z.string().min(1, 'El tipo de servicio es requerido').max(200),
  duracionMin: z.coerce.number().int().positive().default(30),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0'),
  empleadoAsignado: z.string().max(200).optional(),
  notas: z.string().max(1000).optional(),
});

export const actualizarOrdenCarwashSchema = z.object({
  estado: z.enum(['EN_COLA', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO']).optional(),
  empleadoAsignado: z.string().max(200).optional().nullable(),
  notas: z.string().max(1000).optional().nullable(),
  tipoServicio: z.string().max(200).optional(),
  precio: z.coerce.number().positive().optional(),
});

export type CrearOrdenCarwashInput = z.infer<typeof crearOrdenCarwashSchema>;
export type ActualizarOrdenCarwashInput = z.infer<typeof actualizarOrdenCarwashSchema>;
