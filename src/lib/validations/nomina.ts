import { z } from 'zod';

export const CreateEmpleadoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  apellido: z.string().min(1, 'El apellido es requerido').max(100),
  cedula: z.string().regex(/^\d{11}$/, 'La cédula debe tener exactamente 11 dígitos'),
  cargo: z.string().min(1, 'El cargo es requerido').max(100),
  departamento: z.string().max(100).optional(),
  salarioBase: z.number().positive('El salario debe ser mayor que cero'),
  tipoContrato: z.enum(['INDEFINIDO', 'DETERMINADO', 'POR_OBRA', 'TEMPORAL']),
  frecuenciaPago: z.enum(['SEMANAL', 'QUINCENAL', 'MENSUAL']),
  fechaIngreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().max(20).optional(),
  numeroCuenta: z.string().max(30).optional(),
  banco: z.string().max(100).optional(),
  notas: z.string().max(500).optional(),
});

export type CreateEmpleadoInput = z.infer<typeof CreateEmpleadoSchema>;

export const UpdateEmpleadoSchema = CreateEmpleadoSchema.partial().extend({
  estado: z.enum(['ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'TERMINADO']).optional(),
  fechaSalida: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
    .optional(),
});

export type UpdateEmpleadoInput = z.infer<typeof UpdateEmpleadoSchema>;

export const CreateNominaSchema = z.object({
  periodo: z.string().min(1, 'El período es requerido').max(20),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  notas: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        empleadoId: z.string().min(1),
        diasTrabajados: z.number().min(0).max(31).optional(),
        otrosIngresos: z.number().min(0).optional(),
        otrosDescuentos: z.number().min(0).optional(),
      }),
    )
    .min(1, 'La nómina debe tener al menos un empleado'),
});

export type CreateNominaInput = z.infer<typeof CreateNominaSchema>;
