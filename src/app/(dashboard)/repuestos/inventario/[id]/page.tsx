import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft, AlertTriangle } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INDUSTRIAS_REPUESTOS = ['REPUESTOS'];

export default async function DetalleRepuestoPage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_REPUESTOS.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { id } = await params;

  const repuesto = await prisma.repuesto.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
  });
  if (!repuesto) notFound();

  const stockBajo = repuesto.stock <= repuesto.stockMinimo;

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/repuestos/inventario"
          className="rounded-md p-1 text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <Package className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{repuesto.nombre}</h1>
            <p className="font-mono text-sm text-slate-400">{repuesto.codigo}</p>
          </div>
        </div>
      </div>

      {stockBajo && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Stock bajo: {repuesto.stock} unidad{repuesto.stock !== 1 ? 'es' : ''} (mínimo:{' '}
          {repuesto.stockMinimo})
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Información general</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {repuesto.marca && (
            <div>
              <p className="text-xs text-slate-400">Marca del repuesto</p>
              <p className="font-medium text-slate-700">{repuesto.marca}</p>
            </div>
          )}
          {repuesto.descripcion && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-400">Descripción</p>
              <p className="text-sm text-slate-600">{repuesto.descripcion}</p>
            </div>
          )}
          {repuesto.ubicacion && (
            <div>
              <p className="text-xs text-slate-400">Ubicación</p>
              <p className="font-medium text-slate-700">{repuesto.ubicacion}</p>
            </div>
          )}
        </div>
      </div>

      {(repuesto.marcaVehiculo || repuesto.modeloVehiculo) && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Compatibilidad vehicular</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {repuesto.marcaVehiculo && (
              <div>
                <p className="text-xs text-slate-400">Marca</p>
                <p className="font-medium text-slate-700">{repuesto.marcaVehiculo}</p>
              </div>
            )}
            {repuesto.modeloVehiculo && (
              <div>
                <p className="text-xs text-slate-400">Modelo</p>
                <p className="font-medium text-slate-700">{repuesto.modeloVehiculo}</p>
              </div>
            )}
            {(repuesto.anioDesde || repuesto.anioHasta) && (
              <div>
                <p className="text-xs text-slate-400">Años</p>
                <p className="font-medium text-slate-700">
                  {repuesto.anioDesde ?? '?'} – {repuesto.anioHasta ?? 'presente'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Precio e inventario</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">Precio detalle</p>
            <p className="text-xl font-bold text-slate-900">
              RD$ {Number(repuesto.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
          {repuesto.precioMayor && (
            <div>
              <p className="text-xs text-slate-400">Precio mayor</p>
              <p className="text-lg font-semibold text-slate-700">
                RD${' '}
                {Number(repuesto.precioMayor).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400">Stock actual</p>
            <p className={cn('text-xl font-bold', stockBajo ? 'text-red-600' : 'text-green-600')}>
              {repuesto.stock}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Stock mínimo</p>
            <p className="font-medium text-slate-700">{repuesto.stockMinimo}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/repuestos/inventario/${repuesto.id}/editar`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Editar
        </Link>
        <Link
          href="/repuestos/cotizaciones/nueva"
          className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
        >
          Nueva cotización con este repuesto
        </Link>
      </div>
    </div>
  );
}
