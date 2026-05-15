import { z } from 'zod';

export const AbrirCajaSchema = z.object({
  montoApertura: z.number().min(0, 'El monto de apertura no puede ser negativo.'),
  sucursalId: z.string().min(1).optional(),
  notas: z.string().max(500).optional(),
});

export const CerrarCajaSchema = z.object({
  montoCierreDeclarado: z.number().min(0, 'El monto de cierre no puede ser negativo.'),
  notas: z.string().max(500).optional(),
});

export type AbrirCajaInput = z.infer<typeof AbrirCajaSchema>;
export type CerrarCajaInput = z.infer<typeof CerrarCajaSchema>;
