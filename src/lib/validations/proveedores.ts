import { z } from 'zod';
import { TipoIdentificacion } from '@/types/enums';

const BaseProveedorObject = z.object({
  tipoIdentificacion: z.enum(Object.values(TipoIdentificacion) as [string, ...string[]]),
  identificacion: z.string().max(20).optional(),
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(150),
  nombreComercial: z.string().max(150).optional(),
  contacto: z.string().max(150).optional(),
  email: z.email('El correo electrónico no es válido.').optional().or(z.literal('')),
  telefono: z.string().max(20).optional(),
  celular: z.string().max(20).optional(),
  direccion: z.string().max(300).optional(),
  ciudad: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  notas: z.string().max(1000).optional(),
  diasCredito: z.number().int().min(0, 'Los días de crédito no pueden ser negativos.').optional(),
});

export const CreateProveedorSchema = BaseProveedorObject;

export const UpdateProveedorSchema = BaseProveedorObject.partial().extend({
  activo: z.boolean().optional(),
});

export const ProveedorFiltrosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  activo: z.enum(['true', 'false', '']).optional(),
});

export type CreateProveedorInput = z.infer<typeof CreateProveedorSchema>;
export type UpdateProveedorInput = z.infer<typeof UpdateProveedorSchema>;
export type ProveedorFiltrosInput = z.infer<typeof ProveedorFiltrosSchema>;
