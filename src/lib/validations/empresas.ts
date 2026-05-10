import { z } from 'zod';
import { Industria, ModoFiscal } from '@/types/enums';

export const CreateEmpresaSchema = z
  .object({
    nombre: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(100, 'El nombre no puede tener más de 100 caracteres.'),

    nombreComercial: z
      .string()
      .min(2, 'El nombre comercial debe tener al menos 2 caracteres.')
      .max(100, 'El nombre comercial no puede tener más de 100 caracteres.')
      .optional(),

    industria: z.enum(Object.values(Industria) as [string, ...string[]], {
      error: 'Debes seleccionar el tipo de negocio.',
    }),

    modoFiscal: z.enum(Object.values(ModoFiscal) as [string, ...string[]], {
      error: 'Debes seleccionar el modo fiscal.',
    }),

    // RNC: 9 u 11 dígitos (personas físicas usan cédula de 11)
    rnc: z
      .string()
      .regex(/^\d{9}$|^\d{11}$/, 'El RNC debe tener 9 dígitos (empresas) o 11 (cédula).')
      .optional(),

    telefono: z.string().max(20, 'El teléfono no puede tener más de 20 caracteres.').optional(),

    direccion: z
      .string()
      .max(300, 'La dirección no puede tener más de 300 caracteres.')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.modoFiscal === ModoFiscal.FISCAL && !data.rnc) return false;
      return true;
    },
    {
      message: 'El RNC es requerido para el modo fiscal. Ingrésalo o cambia a modo simple.',
      path: ['rnc'],
    },
  );

export type CreateEmpresaInput = z.infer<typeof CreateEmpresaSchema>;
