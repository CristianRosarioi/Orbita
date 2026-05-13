import { z } from 'zod';

export const CreateUnidadMedidaSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(60, 'El nombre no puede tener más de 60 caracteres.'),
  abreviatura: z
    .string()
    .min(1, 'La abreviatura es requerida.')
    .max(10, 'La abreviatura no puede tener más de 10 caracteres.'),
});

export const UpdateUnidadMedidaSchema = z.object({
  nombre: z.string().min(2).max(60).optional(),
  abreviatura: z.string().min(1).max(10).optional(),
  activa: z.boolean().optional(),
});

export type CreateUnidadMedidaInput = z.infer<typeof CreateUnidadMedidaSchema>;
export type UpdateUnidadMedidaInput = z.infer<typeof UpdateUnidadMedidaSchema>;
