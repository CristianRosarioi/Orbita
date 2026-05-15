import { z } from 'zod';
import { MetodoPago } from '@/types/enums';

const metodosPago = Object.values(MetodoPago) as [string, ...string[]];

export const CreateItemFacturaSchema = z.object({
  productoId: z.string().min(1).optional(),
  productoNombre: z.string().min(1, 'El nombre del producto es requerido.').max(200),
  productoSku: z.string().optional(),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0.'),
  precioUnitario: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
  itbisPorcentaje: z.coerce.number().min(0).max(100),
  descuento: z.coerce.number().min(0),
});

export const CreateFacturaSchema = z
  .object({
    clienteId: z.string().min(1).optional(),
    clienteNombre: z
      .string()
      .min(1, 'El nombre del cliente es requerido.')
      .default('Consumidor Final'),
    clienteIdentificacion: z.string().optional(),
    metodoPago: z.enum(metodosPago),
    items: z.array(CreateItemFacturaSchema).min(1, 'La factura debe tener al menos un item.'),
    descuento: z.coerce.number().min(0).optional(),
    notas: z.string().optional(),
    fechaVencimiento: z.string().optional(),
    sucursalId: z.string().min(1).optional(),
    sesionCajaId: z.string().min(1).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.metodoPago === MetodoPago.CREDITO && !d.fechaVencimiento) {
      ctx.addIssue({
        code: 'custom',
        message: 'La fecha de vencimiento es requerida para crédito.',
        path: ['fechaVencimiento'],
      });
    }
  });

export const RegistrarPagoSchema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a 0.'),
  metodoPago: z.enum(metodosPago).refine((v) => v !== MetodoPago.CREDITO, {
    message: 'No se puede registrar un pago con método CREDITO.',
  }),
  referencia: z.string().optional(),
  notas: z.string().optional(),
  fechaPago: z.string().optional(),
});

export const FacturaFiltrosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  estado: z.string().optional(),
  clienteId: z.string().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

export type CreateItemFacturaInput = z.infer<typeof CreateItemFacturaSchema>;
export type CreateFacturaInput = z.infer<typeof CreateFacturaSchema>;
export type RegistrarPagoInput = z.infer<typeof RegistrarPagoSchema>;
export type FacturaFiltrosInput = z.infer<typeof FacturaFiltrosSchema>;
