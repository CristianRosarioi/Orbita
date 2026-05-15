import { z } from 'zod';
import { TipoProducto } from '@/types/enums';

const BaseProductoObject = z.object({
  tipo: z.enum(Object.values(TipoProducto) as [string, ...string[]]),
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(200, 'El nombre no puede tener más de 200 caracteres.'),
  descripcion: z.string().max(1000).optional(),
  sku: z.string().max(50).optional(),
  codigoBarras: z.string().max(50).optional(),
  categoriaId: z.string().min(1).optional().nullable(),
  unidadMedidaId: z.string().min(1, 'Debes seleccionar una unidad de medida.'),
  precioVenta: z.number().min(0, 'El precio de venta no puede ser negativo.'),
  precioCompra: z.number().min(0, 'El precio de compra no puede ser negativo.').optional(),
  itbisAplicable: z.boolean(),
  itbisIncluidoEnPrecio: z.boolean(),
  stockActual: z.number().min(0, 'El stock no puede ser negativo.').optional(),
  stockMinimo: z.number().min(0, 'El stock mínimo no puede ser negativo.').optional(),
  imagenUrl: z.string().url('La URL de la imagen no es válida.').optional().or(z.literal('')),
  precioCredito: z.number().min(0).optional(),
  precioMayorista: z.number().min(0).optional(),
  precioEspecial: z.number().min(0).optional(),
});

export const CreateProductoSchema = BaseProductoObject.refine(
  (d) =>
    d.tipo === TipoProducto.SERVICIO ? d.stockActual === undefined || d.stockActual === 0 : true,
  { message: 'Los servicios no pueden tener stock.', path: ['stockActual'] },
);

export const UpdateProductoSchema = BaseProductoObject.partial()
  .extend({ activo: z.boolean().optional() })
  .refine(
    (d) =>
      d.tipo === TipoProducto.SERVICIO && d.stockActual !== undefined ? d.stockActual === 0 : true,
    { message: 'Los servicios no pueden tener stock.', path: ['stockActual'] },
  );

export const ProductoFiltrosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().optional(),
  categoriaId: z.string().optional(),
  tipo: z.enum(['BIEN', 'SERVICIO', '']).optional(),
  activo: z.enum(['true', 'false', '']).optional(),
});

export type CreateProductoInput = z.infer<typeof CreateProductoSchema>;
export type UpdateProductoInput = z.infer<typeof UpdateProductoSchema>;
export type ProductoFiltrosInput = z.infer<typeof ProductoFiltrosSchema>;
