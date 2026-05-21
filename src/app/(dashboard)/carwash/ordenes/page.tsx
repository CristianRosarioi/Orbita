import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Plus } from 'lucide-react';
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

const TODOS_ESTADOS = ['EN_COLA', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO'];

interface SearchParams { estado?: string; }

export default async function CarwashOrdenesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_CARWASH.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { estado } = await searchParams;

  const ordenes = await prisma.ordenCarwash.findMany({
    where: {
      empresaId: sesion.empresaActivaId,
      deletedAt: null,
      ...(estado ? { estado: estado as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      cliente: { select: { id: true, nombre: true } },
    },
  });

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Órdenes de Carwash</h1>
            <p className="text-sm text-slate-500">{ordenes.length} resultado{ordenes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link href="/carwash/ordenes/nueva" className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}>
          <Plus className="h-4 w-4" />
          Nueva orden
        </Link>
      </div>

      {/* Filtros de estado */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/carwash/ordenes"
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            !estado ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          )}
        >
          Todos
        </Link>
        {TODOS_ESTADOS.map((e) => (
          <Link
            key={e}
            href={`/carwash/ordenes?estado=${e}`}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              estado === e ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {ESTADO_LABELS[e]}
          </Link>
        ))}
      </div>

      {ordenes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">Sin órdenes</p>
          <p className="mt-1 text-xs text-slate-400">No hay órdenes con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Vehículo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Servicio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordenes.map((orden) => (
                <tr key={orden.id} className="group hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/carwash/ordenes/${orden.id}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                      #{orden.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{orden.vehiculoPlaca}</p>
                    {(orden.vehiculoMarca || orden.vehiculoModelo) && (
                      <p className="text-xs text-slate-400">{[orden.vehiculoMarca, orden.vehiculoModelo].filter(Boolean).join(' ')}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{orden.clienteNombre}</td>
                  <td className="px-4 py-3 text-slate-600">{orden.tipoServicio}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-xs', ESTADO_COLORS[orden.estado])}>
                      {ESTADO_LABELS[orden.estado]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    RD$ {Number(orden.precio).toLocaleString('es-DO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
