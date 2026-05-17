import { z } from 'zod';

const rolesInvitables = ['ADMIN', 'VENDEDOR', 'CONTADOR', 'CAJERO', 'VIEWER'] as const;

export const InvitarUsuarioSchema = z.object({
  email: z.string().email('El email es inválido.').max(200),
  rol: z.enum(rolesInvitables, {
    error: 'El rol seleccionado no es válido. No se puede invitar como Propietario.',
  }),
});

export const ActualizarRolSchema = z.object({
  rol: z.enum(rolesInvitables, {
    error: 'El rol seleccionado no es válido. No se puede asignar el rol de Propietario.',
  }),
});

export type InvitarUsuarioInput = z.infer<typeof InvitarUsuarioSchema>;
export type ActualizarRolInput = z.infer<typeof ActualizarRolSchema>;
