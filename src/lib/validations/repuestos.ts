import { z } from 'zod';

export const crearRepuestoSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(50)
    .transform((v) => v.toUpperCase()),
  nombre: z.string().min(1, 'El nombre es requerido').max(300),
  descripcion: z.string().max(1000).optional(),
  marca: z.string().max(100).optional(),
  marcaVehiculo: z.string().max(100).optional(),
  modeloVehiculo: z.string().max(100).optional(),
  anioDesde: z.coerce.number().int().min(1900).max(2100).optional(),
  anioHasta: z.coerce.number().int().min(1900).max(2100).optional(),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0'),
  precioMayor: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  stockMinimo: z.coerce.number().int().min(0).default(2),
  ubicacion: z.string().max(100).optional(),
});

export const actualizarRepuestoSchema = crearRepuestoSchema.partial();

export const itemCotizacionSchema = z.object({
  repuestoId: z.string().cuid().optional(),
  descripcion: z.string().min(1, 'La descripción es requerida').max(300),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.coerce.number().positive('El precio debe ser mayor a 0'),
  itbisPorcentaje: z.coerce.number().min(0).max(100).default(18),
});

export const crearCotizacionSchema = z.object({
  clienteId: z.string().cuid().optional(),
  clienteNombre: z.string().min(1, 'El nombre del cliente es requerido').max(200),
  clienteTelefono: z.string().max(20).optional(),
  vehiculoMarca: z.string().max(100).optional(),
  vehiculoModelo: z.string().max(100).optional(),
  vehiculoAnio: z.coerce.number().int().min(1900).max(2100).optional(),
  vehiculoPlaca: z.string().max(20).optional(),
  notas: z.string().max(1000).optional(),
  validaHasta: z.string().datetime().optional(),
  items: z.array(itemCotizacionSchema).min(1, 'La cotización debe tener al menos un ítem'),
});

export const actualizarEstadoCotizacionSchema = z.object({
  estado: z.enum(['PENDIENTE', 'APROBADA', 'RECHAZADA', 'FACTURADA']),
});

export type CrearRepuestoInput = z.infer<typeof crearRepuestoSchema>;
export type ActualizarRepuestoInput = z.infer<typeof actualizarRepuestoSchema>;
export type CrearCotizacionInput = z.infer<typeof crearCotizacionSchema>;
export type ItemCotizacionInput = z.infer<typeof itemCotizacionSchema>;
