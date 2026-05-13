import { z } from 'zod';
import { TipoCliente, TipoIdentificacion } from '@/types/enums';

const identificacionRefinement = (
  identificacion: string | undefined,
  tipoIdentificacion: string,
) => {
  if (!identificacion) return true;
  if (tipoIdentificacion === TipoIdentificacion.CEDULA) return /^\d{11}$/.test(identificacion);
  if (tipoIdentificacion === TipoIdentificacion.RNC) return /^\d{9}$/.test(identificacion);
  if (tipoIdentificacion === TipoIdentificacion.PASAPORTE)
    return /^[a-zA-Z0-9]{6,15}$/.test(identificacion);
  return true;
};

const identificacionMessage = (tipoIdentificacion: string) =>
  tipoIdentificacion === TipoIdentificacion.CEDULA
    ? 'La cédula debe tener 11 dígitos.'
    : tipoIdentificacion === TipoIdentificacion.RNC
      ? 'El RNC debe tener 9 dígitos.'
      : 'El pasaporte debe tener entre 6 y 15 caracteres alfanuméricos.';

export const CreateClienteSchema = z
  .object({
    tipo: z.enum(Object.values(TipoCliente) as [string, ...string[]], {
      error: 'Debes seleccionar el tipo de cliente.',
    }),
    tipoIdentificacion: z.enum(Object.values(TipoIdentificacion) as [string, ...string[]]),
    identificacion: z.string().max(20).optional(),
    nombre: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(150, 'El nombre no puede tener más de 150 caracteres.'),
    nombreComercial: z.string().max(150).optional(),
    email: z.email('El correo electrónico no es válido.').optional().or(z.literal('')),
    telefono: z.string().max(20).optional(),
    celular: z.string().max(20).optional(),
    direccion: z.string().max(300).optional(),
    ciudad: z.string().max(100).optional(),
    provincia: z.string().max(100).optional(),
    notas: z.string().max(1000).optional(),
    limiteCredito: z.number().min(0, 'El límite de crédito no puede ser negativo.').optional(),
    diasCredito: z.number().int().min(0, 'Los días de crédito no pueden ser negativos.').optional(),
  })
  .superRefine((d, ctx) => {
    if (!identificacionRefinement(d.identificacion, d.tipoIdentificacion)) {
      ctx.addIssue({
        code: 'custom',
        message: identificacionMessage(d.tipoIdentificacion),
        path: ['identificacion'],
      });
    }
  });

export const UpdateClienteSchema = z
  .object({
    tipo: z.enum(Object.values(TipoCliente) as [string, ...string[]]).optional(),
    tipoIdentificacion: z
      .enum(Object.values(TipoIdentificacion) as [string, ...string[]])
      .optional(),
    identificacion: z.string().max(20).optional(),
    nombre: z.string().min(2).max(150).optional(),
    nombreComercial: z.string().max(150).optional(),
    email: z.email().optional().or(z.literal('')),
    telefono: z.string().max(20).optional(),
    celular: z.string().max(20).optional(),
    direccion: z.string().max(300).optional(),
    ciudad: z.string().max(100).optional(),
    provincia: z.string().max(100).optional(),
    notas: z.string().max(1000).optional(),
    limiteCredito: z.number().min(0).optional(),
    diasCredito: z.number().int().min(0).optional(),
    activo: z.boolean().optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.identificacion || !d.tipoIdentificacion) return;
    if (!identificacionRefinement(d.identificacion, d.tipoIdentificacion)) {
      ctx.addIssue({
        code: 'custom',
        message: identificacionMessage(d.tipoIdentificacion),
        path: ['identificacion'],
      });
    }
  });

export const ClienteFiltrosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  tipo: z.enum(['PERSONA', 'EMPRESA', '']).optional(),
  activo: z.enum(['true', 'false', '']).optional(),
});

export type CreateClienteInput = z.infer<typeof CreateClienteSchema>;
export type UpdateClienteInput = z.infer<typeof UpdateClienteSchema>;
export type ClienteFiltrosInput = z.infer<typeof ClienteFiltrosSchema>;
