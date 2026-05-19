import { z } from 'zod';

export const CreateOrdenTrabajoSchema = z.object({
  clienteId: z.string().optional(),
  clienteNombre: z.string().min(1, 'El nombre del cliente es requerido').max(150),
  clienteTelefono: z.string().max(20).optional(),
  vehiculoMarca: z.string().min(1, 'La marca es requerida').max(60),
  vehiculoModelo: z.string().min(1, 'El modelo es requerido').max(60),
  vehiculoAnio: z.number().int().min(1900).max(2100).optional(),
  vehiculoPlaca: z.string().min(1, 'La placa es requerida').max(20),
  vehiculoColor: z.string().max(30).optional(),
  kilometraje: z.number().int().min(0).optional(),
  descripcionFalla: z.string().min(1, 'Describe la falla del vehículo').max(1000),
  tecnico: z.string().max(100).optional(),
  fechaPromesa: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Fecha inválida')
    .optional(),
  notas: z.string().max(500).optional(),
});

export type CreateOrdenTrabajoInput = z.infer<typeof CreateOrdenTrabajoSchema>;

export const UpdateOrdenTrabajoSchema = z.object({
  estado: z
    .enum([
      'RECIBIDO',
      'EN_DIAGNOSTICO',
      'ESPERANDO_REPUESTOS',
      'EN_REPARACION',
      'LISTO',
      'ENTREGADO',
      'CANCELADO',
    ])
    .optional(),
  diagnostico: z.string().max(2000).optional(),
  trabajoRealizado: z.string().max(2000).optional(),
  tecnico: z.string().max(100).optional(),
  fechaPromesa: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Fecha inválida')
    .optional(),
  notas: z.string().max(500).optional(),
});

export type UpdateOrdenTrabajoInput = z.infer<typeof UpdateOrdenTrabajoSchema>;

export const AddItemOrdenTrabajoSchema = z.object({
  tipo: z.enum(['SERVICIO', 'REPUESTO']),
  descripcion: z.string().min(1, 'La descripción es requerida').max(200),
  productoId: z.string().optional(),
  cantidad: z.number().positive('La cantidad debe ser mayor que cero'),
  precioUnitario: z.number().positive('El precio debe ser mayor que cero'),
  itbisPorcentaje: z.number().min(0).max(100).default(18),
});

export type AddItemOrdenTrabajoInput = z.infer<typeof AddItemOrdenTrabajoSchema>;

export const FacturarOrdenTrabajoSchema = z.object({
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO']),
});

export type FacturarOrdenTrabajoInput = z.infer<typeof FacturarOrdenTrabajoSchema>;
