'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { CreateProductoSchema, type CreateProductoInput } from '@/lib/validations/productos';
import { TipoProducto } from '@/types/enums';

interface CategoriaOption {
  id: string;
  nombre: string;
}

interface UnidadOption {
  id: string;
  nombre: string;
  abreviatura: string;
}

interface ProductoFormProps {
  defaultValues?: Partial<CreateProductoInput>;
  productoId?: string;
  categorias: CategoriaOption[];
  unidades: UnidadOption[];
}

export function ProductoForm({
  defaultValues,
  productoId,
  categorias,
  unidades,
}: ProductoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateProductoInput>({
    resolver: zodResolver(CreateProductoSchema),
    defaultValues: {
      tipo: TipoProducto.BIEN,
      itbisAplicable: true,
      itbisIncluidoEnPrecio: false,
      stockActual: 0,
      stockMinimo: 0,
      precioVenta: 0,
      precioCompra: 0,
      ...defaultValues,
    },
  });

  const tipo = watch('tipo');

  const onSubmit = async (data: CreateProductoInput) => {
    setLoading(true);
    try {
      const url = productoId ? `/api/productos/${productoId}` : '/api/productos';
      const method = productoId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error?.message ?? json.error ?? 'Error al guardar el producto.');
        return;
      }

      toast.success(productoId ? 'Producto actualizado.' : 'Producto creado exitosamente.');
      router.push('/productos');
      router.refresh();
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="informacion">
        <TabsList className="mb-4">
          <TabsTrigger value="informacion">Información</TabsTrigger>
          <TabsTrigger value="precios">Precios</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
        </TabsList>

        {/* TAB: Información */}
        <TabsContent value="informacion" className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo de producto</Label>
            <RadioGroup
              value={tipo}
              onValueChange={(val) => setValue('tipo', val as TipoProducto)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value={TipoProducto.BIEN} id="tipo-bien" />
                <Label htmlFor="tipo-bien" className="cursor-pointer font-normal">
                  Bien (artículo físico)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value={TipoProducto.SERVICIO} id="tipo-servicio" />
                <Label htmlFor="tipo-servicio" className="cursor-pointer font-normal">
                  Servicio
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input id="nombre" {...register('nombre')} placeholder="Nombre del producto o servicio" />
              {errors.nombre && <p className="text-sm text-red-600">{errors.nombre.message}</p>}
            </div>

            {/* Categoría */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoriaId">Categoría</Label>
              <select
                id="categoriaId"
                {...register('categoriaId')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {errors.categoriaId && (
                <p className="text-xs text-red-500">{errors.categoriaId.message}</p>
              )}
            </div>

            {/* Unidad de medida */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unidadMedidaId">
                Unidad de medida <span className="text-red-500">*</span>
              </Label>
              <select
                id="unidadMedidaId"
                {...register('unidadMedidaId')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Seleccionar unidad...</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.abreviatura})
                  </option>
                ))}
              </select>
              {errors.unidadMedidaId && (
                <p className="text-xs text-red-500">{errors.unidadMedidaId.message}</p>
              )}
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Código interno</Label>
              <Input id="sku" {...register('sku')} placeholder="PRD-001" />
              {errors.sku && <p className="text-sm text-red-600">{errors.sku.message}</p>}
            </div>

            {/* Código de barras */}
            <div className="space-y-2">
              <Label htmlFor="codigoBarras">Código de barras</Label>
              <Input id="codigoBarras" {...register('codigoBarras')} placeholder="0000000000000" />
              {errors.codigoBarras && (
                <p className="text-sm text-red-600">{errors.codigoBarras.message}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Descripción del producto o servicio..."
              rows={3}
            />
            {errors.descripcion && (
              <p className="text-sm text-red-600">{errors.descripcion.message}</p>
            )}
          </div>
        </TabsContent>

        {/* TAB: Precios */}
        <TabsContent value="precios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precioVenta">
                Precio de venta (RD$) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="precioVenta"
                type="number"
                min={0}
                step={0.01}
                {...register('precioVenta', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.precioVenta && (
                <p className="text-sm text-red-600">{errors.precioVenta.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="precioCompra">Precio de compra (RD$)</Label>
              <Input
                id="precioCompra"
                type="number"
                min={0}
                step={0.01}
                {...register('precioCompra', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.precioCompra && (
                <p className="text-sm text-red-600">{errors.precioCompra.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* ITBIS */}
          <div className="space-y-3">
            <Controller
              name="itbisAplicable"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="itbisAplicable" className="cursor-pointer">
                      ITBIS aplicable (18%)
                    </Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Este producto o servicio está gravado con ITBIS
                    </p>
                  </div>
                  <Switch
                    id="itbisAplicable"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            <Controller
              name="itbisIncluidoEnPrecio"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="itbisIncluidoEnPrecio" className="cursor-pointer">
                      ITBIS incluido en el precio
                    </Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      El precio de venta ya incluye el ITBIS
                    </p>
                  </div>
                  <Switch
                    id="itbisIncluidoEnPrecio"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </div>

          <Separator />

          {/* Precios adicionales por nivel */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Precios por nivel (opcional)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precioCredito">Crédito (RD$)</Label>
                <Input
                  id="precioCredito"
                  type="number"
                  min={0}
                  step={0.01}
                  {...register('precioCredito', { setValueAs: (v) => v === '' ? undefined : parseFloat(v) })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precioMayorista">Mayorista (RD$)</Label>
                <Input
                  id="precioMayorista"
                  type="number"
                  min={0}
                  step={0.01}
                  {...register('precioMayorista', { setValueAs: (v) => v === '' ? undefined : parseFloat(v) })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precioEspecial">Especial (RD$)</Label>
                <Input
                  id="precioEspecial"
                  type="number"
                  min={0}
                  step={0.01}
                  {...register('precioEspecial', { setValueAs: (v) => v === '' ? undefined : parseFloat(v) })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: Inventario */}
        <TabsContent value="inventario" className="space-y-4">
          {tipo === TipoProducto.SERVICIO ? (
            <div className="rounded-md bg-slate-50 border border-slate-200 p-6 text-center">
              <Package className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-slate-600 font-medium">Los servicios no tienen inventario</p>
              <p className="text-sm text-slate-400 mt-1">
                El control de stock solo aplica para productos físicos (bienes).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockActual">Stock actual</Label>
                <Input
                  id="stockActual"
                  type="number"
                  min={0}
                  step={0.01}
                  {...register('stockActual', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.stockActual && (
                  <p className="text-sm text-red-600">{errors.stockActual.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockMinimo">Stock mínimo</Label>
                <Input
                  id="stockMinimo"
                  type="number"
                  min={0}
                  step={0.01}
                  {...register('stockMinimo', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.stockMinimo && (
                  <p className="text-sm text-red-600">{errors.stockMinimo.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Recibirás alertas cuando el stock baje de este nivel.
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : productoId ? 'Actualizar producto' : 'Crear producto'}
        </Button>
        <Link href="/productos" className="text-sm text-slate-600 hover:text-slate-900">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
