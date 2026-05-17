import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { getCurrentEmpresa } from '@/lib/auth';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const LABEL_TIPO: Record<string, string> = { BIEN: 'Bien', SERVICIO: 'Servicio' };
const LABEL_NIVEL: Record<string, string> = {
  CONTADO: 'Contado',
  CREDITO: 'Crédito',
  MAYORISTA: 'Mayorista',
  ESPECIAL: 'Especial',
};

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-900">{valor || '—'}</p>
    </div>
  );
}

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const { id } = await params;

  const producto = await prisma.producto.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    include: {
      categoria: { select: { nombre: true } },
      unidadMedida: { select: { nombre: true, abreviatura: true } },
      precios: true,
    },
  });

  if (!producto) notFound();

  const fechaCreacion = new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(producto.createdAt);

  const precioVenta = Number(producto.precioVenta).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
  });

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/productos" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{producto.nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {LABEL_TIPO[producto.tipo]}
              </Badge>
              {producto.categoria && (
                <Badge variant="secondary" className="text-xs">
                  {producto.categoria.nombre}
                </Badge>
              )}
              <Badge variant={producto.activo ? 'default' : 'secondary'} className="text-xs">
                {producto.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </div>
        <Link href={`/productos/${id}/editar`} className={buttonVariants({ variant: 'outline' })}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Link>
      </div>

      {/* Datos generales */}
      <Card className="p-6 space-y-5">
        <h2 className="font-semibold text-slate-900">Información general</h2>
        <Separator />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo label="SKU" valor={producto.sku} />
          <Campo label="Código de barras" valor={producto.codigoBarras} />
          <Campo
            label="Unidad de medida"
            valor={
              producto.unidadMedida
                ? `${producto.unidadMedida.nombre} (${producto.unidadMedida.abreviatura})`
                : undefined
            }
          />
        </div>
        {producto.descripcion && <Campo label="Descripción" valor={producto.descripcion} />}
      </Card>

      {/* Precios */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Precios</h2>
        <Separator />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo label="Precio de venta" valor={`RD$ ${precioVenta}`} />
          <Campo
            label="Precio de compra"
            valor={`RD$ ${Number(producto.precioCompra).toLocaleString('es-DO', {
              minimumFractionDigits: 2,
            })}`}
          />
          <Campo
            label="ITBIS"
            valor={
              producto.itbisAplicable
                ? producto.itbisIncluidoEnPrecio
                  ? '18% (incluido en precio)'
                  : '18% (sobre precio)'
                : 'No aplica'
            }
          />
        </div>

        {producto.precios && producto.precios.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Precios por nivel
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {producto.precios.map((p) => (
                  <div key={p.id} className="border border-slate-100 rounded p-3">
                    <p className="text-xs text-slate-500">{LABEL_NIVEL[p.nivel] ?? p.nivel}</p>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      RD$ {Number(p.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Inventario — solo si es BIEN */}
      {producto.tipo === 'BIEN' && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Inventario</h2>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <Campo
              label="Stock actual"
              valor={Number(producto.stockActual).toLocaleString('es-DO', {
                minimumFractionDigits: 2,
              })}
            />
            <Campo
              label="Stock mínimo"
              valor={Number(producto.stockMinimo).toLocaleString('es-DO', {
                minimumFractionDigits: 2,
              })}
            />
          </div>
          {Number(producto.stockActual) <= Number(producto.stockMinimo) &&
            Number(producto.stockMinimo) > 0 && (
              <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                El stock está por debajo del mínimo configurado.
              </div>
            )}
        </Card>
      )}

      <p className="text-xs text-slate-400">Producto creado el {fechaCreacion}</p>
    </div>
  );
}
