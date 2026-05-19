import { z } from 'zod';

export const CreateCitaSchema = z.object({
  clienteId: z.string().optional(),
  clienteNombre: z.string().min(1, 'El nombre del cliente es requerido').max(150),
  clienteTelefono: z.string().max(20).optional(),
  empleadoId: z.string().optional(),
  servicio: z.string().min(1, 'El servicio es requerido').max(200),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Fecha y hora inválida'),
  duracionMin: z.number().int().min(15).max(480).default(60),
  precio: z.number().positive('El precio debe ser mayor que cero'),
  notas: z.string().max(500).optional(),
});

export type CreateCitaInput = z.infer<typeof CreateCitaSchema>;

export const UpdateCitaSchema = z.object({
  estado: z
    .enum(['PENDIENTE', 'CONFIRMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA', 'NO_SHOW'])
    .optional(),
  empleadoId: z.string().optional(),
  servicio: z.string().max(200).optional(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Fecha y hora inválida')
    .optional(),
  duracionMin: z.number().int().min(15).max(480).optional(),
  precio: z.number().positive().optional(),
  notas: z.string().max(500).optional(),
});

export type UpdateCitaInput = z.infer<typeof UpdateCitaSchema>;
