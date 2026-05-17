import { z } from 'zod';

export const CreateCuentaFiadoSchema = z.object({
  clienteId: z.string().min(1, 'El cliente es requerido.'),
  limite: z.coerce.number().min(0, 'El límite no puede ser negativo.').default(0),
  notas: z.string().max(500).optional(),
});

export const UpdateCuentaFiadoSchema = z.object({
  limite: z.coerce.number().min(0).optional(),
  notas: z.string().max(500).optional(),
  estado: z.enum(['PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO', 'VENCIDO']).optional(),
});

export const CargoFiadoSchema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a 0.'),
  descripcion: z.string().max(300).optional(),
  facturaId: z.string().optional(),
});

export const AbonoFiadoSchema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a 0.'),
  descripcion: z.string().max(300).optional(),
});
