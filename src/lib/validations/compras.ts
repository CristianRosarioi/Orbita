import { z } from 'zod';

export const CreateItemOrdenCompraSchema = z.object({
  productoId: z.string().min(1).optional(),
  descripcion: z.string().min(1, 'La descripción del ítem es requerida.').max(300),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0.'),
  costoUnitario: z.coerce.number().min(0, 'El costo no puede ser negativo.'),
  itbisPorcentaje: z.coerce.number().min(0).max(100).default(0),
});

export const CreateOrdenCompraSchema = z.object({
  proveedorId: z.string().min(1, 'El proveedor es requerido.'),
  items: z.array(CreateItemOrdenCompraSchema).min(1, 'La orden debe tener al menos un ítem.'),
  notas: z.string().max(500).optional(),
  fechaEsperada: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
});

export const UpdateOrdenCompraSchema = z.object({
  notas: z.string().max(500).optional(),
  fechaEsperada: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
});

export const RecibirOrdenSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        cantidadRecibida: z.coerce.number().min(0, 'La cantidad recibida no puede ser negativa.'),
      }),
    )
    .min(1),
  notas: z.string().max(500).optional(),
});

export const CreateGastoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida.').max(300),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0.'),
  itbis: z.coerce.number().min(0, 'El ITBIS no puede ser negativo.').default(0),
  categoria: z.string().max(50).optional(),
  proveedorId: z.string().min(1).optional(),
  fechaGasto: z.string().min(1, 'La fecha del gasto es requerida.'),
  comprobante: z.string().max(100).optional(),
  ncfProveedor: z.string().max(19).optional(),
  notas: z.string().max(500).optional(),
});

export const UpdateGastoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'PAGADO', 'VENCIDO']).optional(),
  fechaPago: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  notas: z.string().max(500).optional(),
});
