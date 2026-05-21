import { z } from 'zod';

export const CrearPropiedadSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(20),
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  tipo: z.enum(['APARTAMENTO', 'CASA', 'LOCAL_COMERCIAL', 'OFICINA', 'TERRENO', 'NAVE_INDUSTRIAL']),
  direccion: z.string().min(1, 'La dirección es requerida'),
  sector: z.string().optional(),
  ciudad: z.string().default('Santo Domingo'),
  habitaciones: z.coerce.number().int().min(0).optional(),
  banos: z.coerce.number().int().min(0).optional(),
  metrosCuadrados: z.coerce.number().positive().optional(),
  precioAlquiler: z.coerce.number().positive().optional(),
  precioVenta: z.coerce.number().positive().optional(),
  descripcion: z.string().optional(),
  notas: z.string().optional(),
});

export const ActualizarPropiedadSchema = CrearPropiedadSchema.partial().extend({
  estado: z.enum(['DISPONIBLE', 'ALQUILADA', 'EN_VENTA', 'VENDIDA', 'MANTENIMIENTO']).optional(),
  activa: z.boolean().optional(),
});

export const CrearContratoSchema = z
  .object({
    propiedadId: z.string().min(1),
    clienteId: z.string().optional(),
    inquilinoNombre: z.string().min(1, 'El nombre del inquilino es requerido'),
    inquilinoTelefono: z.string().optional(),
    inquilinoCedula: z.string().optional(),
    montoMensual: z.coerce.number().positive('El monto mensual debe ser mayor que 0'),
    deposito: z.coerce.number().min(0).default(0),
    fechaInicio: z.coerce.date(),
    fechaFin: z.coerce.date(),
    notas: z.string().optional(),
  })
  .refine((d) => d.fechaFin > d.fechaInicio, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fechaFin'],
  });

export const RegistrarPagoSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de mes inválido. Use YYYY-MM'),
  monto: z.coerce.number().positive('El monto debe ser mayor que 0'),
  notas: z.string().optional(),
});

export type CrearPropiedadInput = z.infer<typeof CrearPropiedadSchema>;
export type ActualizarPropiedadInput = z.infer<typeof ActualizarPropiedadSchema>;
export type CrearContratoInput = z.infer<typeof CrearContratoSchema>;
export type RegistrarPagoInput = z.infer<typeof RegistrarPagoSchema>;
