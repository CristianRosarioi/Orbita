import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Car, Plus, RefreshCw } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INDUSTRIAS_CARWASH = ['CARWASH'];

const ESTADO_LABELS: Record<string, string> = {
  EN_COLA: 'En cola',
  EN_PROCESO: 'En proceso',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const ESTADO_COLORS: Record<string, string> = {
  EN_COLA: 'bg-amber-100 text-amber-700',
  EN_PROCESO: 'bg-blue-100 text-blue-700',
  LISTO: 'bg-emerald-100 text-emerald-700',
  ENTREGADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-700',
};

export default async function CarwashColaPage() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_CARWASH.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const cola = await prisma.ordenCarwash.findMany({
    where: {
      empresaId: sesion.empresaActivaId,
      estado: { in: ['EN_COLA', 'EN_PROCESO'] },
      deletedAt: null,
    },
    orderBy: [{ estado: 'asc' }, { createdAt: 'asc' }],
    include: {
      cliente: { select: { id: true, nombre: true } },
    },
  });

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Car className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Cola de servicio</h1>
            <p className="text-sm text-slate-500">
              {cola.length} vehículo{cola.length !== 1 ? 's' : ''} activo
              {cola.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/carwash/cola"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </a>
          <Link
            href="/carwash/ordenes/nueva"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
          >
            <Plus className="h-4 w-4" />
            Nueva orden
          </Link>
        </div>
      </div>

      {cola.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <Car className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">Cola vacía</p>
          <p className="mt-1 text-xs text-slate-400">No hay vehículos en servicio actualmente</p>
          <Link
            href="/carwash/ordenes/nueva"
            className={cn(buttonVariants({ size: 'sm' }), 'mt-4 gap-2')}
          >
            <Plus className="h-4 w-4" />
            Agregar primer vehículo
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cola.map((orden) => (
            <Link
              key={orden.id}
              href={`/carwash/ordenes/${orden.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">#{orden.numero}</span>
                <Badge className={cn('text-xs', ESTADO_COLORS[orden.estado])}>
                  {ESTADO_LABELS[orden.estado]}
                </Badge>
              </div>

              <div className="mb-3">
                <p className="text-lg font-bold text-slate-900">{orden.vehiculoPlaca}</p>
                {(orden.vehiculoMarca || orden.vehiculoModelo) && (
                  <p className="text-sm text-slate-500">
                    {[orden.vehiculoMarca, orden.vehiculoModelo, orden.vehiculoColor]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>

              <p className="mb-1 text-sm font-medium text-slate-700">{orden.tipoServicio}</p>
              <p className="text-xs text-slate-400">{orden.clienteNombre}</p>

              {orden.empleadoAsignado && (
                <p className="mt-2 text-xs text-slate-500">Empleado: {orden.empleadoAsignado}</p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">{orden.duracionMin} min</span>
                <span className="text-sm font-semibold text-slate-900">
                  RD$ {Number(orden.precio).toLocaleString('es-DO')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 text-right">
        <Link href="/carwash/ordenes" className="text-sm text-indigo-600 hover:text-indigo-700">
          Ver todas las órdenes →
        </Link>
      </div>
    </div>
  );
}
