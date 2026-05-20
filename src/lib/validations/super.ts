import { z } from 'zod';

export const CreateDepartamentoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  descripcion: z.string().max(500).optional(),
});

export type CreateDepartamentoInput = z.infer<typeof CreateDepartamentoSchema>;

export const UpdateDepartamentoSchema = CreateDepartamentoSchema.partial().extend({
  activo: z.boolean().optional(),
});

export type UpdateDepartamentoInput = z.infer<typeof UpdateDepartamentoSchema>;

export const CreateCategoriaSuperSchema = z.object({
  departamentoId: z.string().min(1, 'El departamento es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
});

export type CreateCategoriaSuperInput = z.infer<typeof CreateCategoriaSuperSchema>;

export const CreateOfertaSchema = z
  .object({
    productoId: z.string().min(1, 'El producto es requerido'),
    categoriaId: z.string().optional(),
    nombre: z.string().min(1, 'El nombre de la oferta es requerido').max(150),
    descripcion: z.string().max(500).optional(),
    precioOriginal: z.coerce.number().positive('El precio original debe ser mayor a 0'),
    precioOferta: z.coerce.number().positive('El precio de oferta debe ser mayor a 0'),
    fechaInicio: z.string().datetime({ offset: true }),
    fechaFin: z.string().datetime({ offset: true }),
  })
  .refine((d) => d.precioOferta < d.precioOriginal, {
    message: 'El precio de oferta debe ser menor al precio original',
    path: ['precioOferta'],
  })
  .refine((d) => new Date(d.fechaFin) > new Date(d.fechaInicio), {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fechaFin'],
  });

export type CreateOfertaInput = z.infer<typeof CreateOfertaSchema>;

export const UpdateOfertaSchema = z.object({
  nombre: z.string().min(1).max(150).optional(),
  descripcion: z.string().max(500).optional(),
  precioOferta: z.coerce.number().positive().optional(),
  fechaInicio: z.string().datetime({ offset: true }).optional(),
  fechaFin: z.string().datetime({ offset: true }).optional(),
  activa: z.boolean().optional(),
});

export type UpdateOfertaInput = z.infer<typeof UpdateOfertaSchema>;

export const CreatePrecioVolumenSchema = z.object({
  productoId: z.string().min(1, 'El producto es requerido'),
  cantidadMin: z.coerce.number().positive('La cantidad mínima debe ser mayor a 0'),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0'),
  etiqueta: z.string().max(50).optional(),
});

export type CreatePrecioVolumenInput = z.infer<typeof CreatePrecioVolumenSchema>;

export const UpdatePrecioVolumenSchema = z.object({
  cantidadMin: z.coerce.number().positive().optional(),
  precio: z.coerce.number().positive().optional(),
  etiqueta: z.string().max(50).optional(),
  activo: z.boolean().optional(),
});

export type UpdatePrecioVolumenInput = z.infer<typeof UpdatePrecioVolumenSchema>;
