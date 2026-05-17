import { z } from 'zod';

export const CreateMesaSchema = z.object({
  numero: z.coerce.number().int().positive('El número de mesa debe ser mayor a 0.'),
  nombre: z.string().max(100).optional(),
  capacidad: z.coerce.number().int().min(1).max(50).default(4),
});

export const UpdateMesaSchema = z.object({
  nombre: z.string().max(100).optional(),
  capacidad: z.coerce.number().int().min(1).max(50).optional(),
  estado: z.enum(['DISPONIBLE', 'OCUPADA', 'RESERVADA', 'INACTIVA']).optional(),
  activa: z.boolean().optional(),
});

export const CreateComandaSchema = z.object({
  mesaId: z.string().min(1).optional(),
  mesero: z.string().max(100).optional(),
  personas: z.coerce.number().int().min(1).default(1),
  notas: z.string().max(500).optional(),
});

export const UpdateComandaSchema = z.object({
  estado: z.enum(['ABIERTA', 'LISTA', 'SERVIDA', 'CANCELADA']).optional(),
  mesero: z.string().max(100).optional(),
  personas: z.coerce.number().int().min(1).optional(),
  notas: z.string().max(500).optional(),
  propina: z.coerce.number().min(0).optional(),
});

export const AddItemComandaSchema = z.object({
  productoId: z.string().min(1).optional(),
  nombre: z.string().min(1, 'El nombre del ítem es requerido.').max(200),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0.'),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
  notas: z.string().max(300).optional(),
});

export const UpdateItemComandaSchema = z.object({
  cantidad: z.coerce.number().positive().optional(),
  notas: z.string().max(300).optional(),
  estado: z.enum(['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'CANCELADO']).optional(),
});
