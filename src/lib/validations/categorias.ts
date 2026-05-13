import { z } from 'zod';

export const CreateCategoriaSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(80, 'El nombre no puede tener más de 80 caracteres.'),
  descripcion: z.string().max(300).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'El color debe ser un código hexadecimal válido (#RRGGBB).')
    .optional(),
  icono: z.string().max(50).optional(),
  orden: z.number().int().min(0).optional(),
});

export const UpdateCategoriaSchema = z.object({
  nombre: z.string().min(2).max(80).optional(),
  descripcion: z.string().max(300).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'El color debe ser un código hexadecimal válido (#RRGGBB).')
    .optional(),
  icono: z.string().max(50).optional(),
  orden: z.number().int().min(0).optional(),
  activa: z.boolean().optional(),
});

export type CreateCategoriaInput = z.infer<typeof CreateCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof UpdateCategoriaSchema>;
