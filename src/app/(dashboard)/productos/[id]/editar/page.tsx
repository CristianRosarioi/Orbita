import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { getCurrentEmpresa } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { ProductoForm } from '../../_components/producto-form';
import type { CreateProductoInput } from '@/lib/validations/productos';
import { TipoProducto } from '@/types/enums';

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const { id } = await params;
  const empresaId = sesion.empresaActivaId;

  const [producto, categorias, unidades] = await Promise.all([
    prisma.producto.findFirst({
      where: { id, empresaId, deletedAt: null },
    }),
    prisma.categoria.findMany({
      where: { empresaId, deletedAt: null, activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.unidadMedida.findMany({
      where: { empresaId, deletedAt: null, activa: true },
      select: { id: true, nombre: true, abreviatura: true },
      orderBy: { nombre: 'asc' },
    }),
  ]);

  if (!producto) notFound();

  const defaultValues: Partial<CreateProductoInput> = {
    tipo: producto.tipo as TipoProducto,
    nombre: producto.nombre,
    descripcion: producto.descripcion ?? undefined,
    sku: producto.sku ?? undefined,
    codigoBarras: producto.codigoBarras ?? undefined,
    categoriaId: producto.categoriaId ?? undefined,
    unidadMedidaId: producto.unidadMedidaId,
    precioVenta: Number(producto.precioVenta),
    precioCompra: Number(producto.precioCompra),
    itbisAplicable: producto.itbisAplicable,
    itbisIncluidoEnPrecio: producto.itbisIncluidoEnPrecio,
    stockActual: Number(producto.stockActual),
    stockMinimo: Number(producto.stockMinimo),
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/productos/${id}`} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar producto</h1>
          <p className="text-slate-500 text-sm mt-0.5">{producto.nombre}</p>
        </div>
      </div>

      <Card className="p-6">
        <ProductoForm
          defaultValues={defaultValues}
          productoId={id}
          categorias={categorias}
          unidades={unidades}
        />
      </Card>
    </div>
  );
}
