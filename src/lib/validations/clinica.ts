import { z } from 'zod';

export const CreatePacienteSchema = z.object({
  clienteId: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  apellido: z.string().min(1, 'El apellido es requerido').max(100),
  fechaNacimiento: z.string().datetime({ offset: true }).optional().or(z.literal('')).transform((v) => v || undefined),
  sexo: z.enum(['MASCULINO', 'FEMENINO', 'OTRO']).optional(),
  cedula: z
    .string()
    .regex(/^\d{11}$/, 'La cédula debe tener 11 dígitos')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  telefono: z.string().max(20).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')).transform((v) => v || undefined),
  direccion: z.string().max(255).optional(),
  tipoSangre: z
    .enum([
      'A_POSITIVO',
      'A_NEGATIVO',
      'B_POSITIVO',
      'B_NEGATIVO',
      'AB_POSITIVO',
      'AB_NEGATIVO',
      'O_POSITIVO',
      'O_NEGATIVO',
      'DESCONOCIDO',
    ])
    .optional(),
  alergias: z.string().max(1000).optional(),
  antecedentes: z.string().max(2000).optional(),
});

export type CreatePacienteInput = z.infer<typeof CreatePacienteSchema>;

export const UpdatePacienteSchema = CreatePacienteSchema.partial().extend({
  estado: z.enum(['ACTIVO', 'INACTIVO', 'ARCHIVADO']).optional(),
});

export type UpdatePacienteInput = z.infer<typeof UpdatePacienteSchema>;

export const CreateConsultaSchema = z.object({
  pacienteId: z.string().min(1, 'El paciente es requerido'),
  medicoNombre: z.string().min(1, 'El nombre del médico es requerido').max(100),
  fechaHora: z.string().datetime({ offset: true }),
  motivo: z.string().max(500).optional(),
  diagnostico: z.string().max(2000).optional(),
  tratamiento: z.string().max(2000).optional(),
  receta: z.string().max(3000).optional(),
  peso: z.coerce.number().positive().optional(),
  talla: z.coerce.number().positive().optional(),
  temperatura: z.coerce.number().positive().optional(),
  frecuenciaCard: z.coerce.number().positive().optional(),
  presionArterial: z.string().max(20).optional(),
  notas: z.string().max(2000).optional(),
  precio: z.coerce.number().nonnegative().optional(),
});

export type CreateConsultaInput = z.infer<typeof CreateConsultaSchema>;

export const UpdateConsultaSchema = z.object({
  medicoNombre: z.string().min(1).max(100).optional(),
  fechaHora: z.string().datetime({ offset: true }).optional(),
  motivo: z.string().max(500).optional(),
  diagnostico: z.string().max(2000).optional(),
  tratamiento: z.string().max(2000).optional(),
  receta: z.string().max(3000).optional(),
  peso: z.coerce.number().positive().optional(),
  talla: z.coerce.number().positive().optional(),
  temperatura: z.coerce.number().positive().optional(),
  frecuenciaCard: z.coerce.number().positive().optional(),
  presionArterial: z.string().max(20).optional(),
  notas: z.string().max(2000).optional(),
  estado: z.enum(['PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO']).optional(),
  precio: z.coerce.number().nonnegative().optional(),
});

export type UpdateConsultaInput = z.infer<typeof UpdateConsultaSchema>;
