import { z } from 'zod';

export const CreateSucursalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  codigo: z.string().min(1, 'El código es requerido').max(10),
  direccion: z.string().max(255).optional(),
  telefono: z.string().max(20).optional(),
  ciudad: z.string().max(100).optional(),
  encargado: z.string().max(100).optional(),
  esPrincipal: z.boolean().optional(),
});

export type CreateSucursalInput = z.infer<typeof CreateSucursalSchema>;

export const UpdateSucursalSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  codigo: z.string().min(1).max(10).optional(),
  direccion: z.string().max(255).optional(),
  telefono: z.string().max(20).optional(),
  ciudad: z.string().max(100).optional(),
  encargado: z.string().max(100).optional(),
  esPrincipal: z.boolean().optional(),
  activa: z.boolean().optional(),
});

export type UpdateSucursalInput = z.infer<typeof UpdateSucursalSchema>;

export const CreateTransferenciaSchema = z
  .object({
    sucursalOrigenId: z.string().min(1, 'La sucursal de origen es requerida'),
    sucursalDestinoId: z.string().min(1, 'La sucursal de destino es requerida'),
    productoId: z.string().min(1, 'El producto es requerido'),
    cantidad: z.number().positive('La cantidad debe ser mayor que cero'),
    notas: z.string().max(500).optional(),
  })
  .refine((d) => d.sucursalOrigenId !== d.sucursalDestinoId, {
    message: 'La sucursal de origen y destino no pueden ser la misma',
    path: ['sucursalDestinoId'],
  });

export type CreateTransferenciaInput = z.infer<typeof CreateTransferenciaSchema>;
