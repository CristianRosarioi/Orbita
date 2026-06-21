import { redirect } from 'next/navigation';
import Link from 'next/link';
import { RotateCcw, Plus } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INDUSTRIAS_TIENDA_ROPA = ['TIENDA_ROPA'];

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  COMPLETADA: 'Completada',
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  APROBADA: 'bg-blue-100 text-blue-700',
  RECHAZADA: 'bg-red-100 text-red-700',
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
};

const TIPO_LABELS: Record<string, string> = {
  DEVOLUCION: 'Devolución',
  INTERCAMBIO: 'Intercambio',
};

const TODOS_ESTADOS = ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'COMPLETADA'];

interface SearchParams {
  estado?: string;
  tipo?: string;
}

export default async function DevolucionesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_TIENDA_ROPA.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { estado, tipo } = await searchParams;

  const devoluciones = await prisma.devolucion.findMany({
    where: {
      empresaId: sesion.empresaActivaId,
      ...(estado ? { estado: estado as never } : {}),
      ...(tipo ? { tipo } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      factura: { select: { id: true, numero: true } },
      cliente: { select: { id: true, nombre: true } },
    },
  });

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
            <RotateCcw className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Devoluciones</h1>
            <p className="text-sm text-slate-500">
              {devoluciones.length} resultado{devoluciones.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link
          href="/tienda-ropa/devoluciones/nueva"
          className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
        >
          <Plus className="h-4 w-4" />
          Nueva devolución
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/tienda-ropa/devoluciones"
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            !estado ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          )}
        >
          Todos
        </Link>
        {TODOS_ESTADOS.map((e) => (
          <Link
            key={e}
            href={`/tienda-ropa/devoluciones?estado=${e}`}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              estado === e
                ? 'bg-pink-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {ESTADO_LABELS[e]}
          </Link>
        ))}
      </div>

      {devoluciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <RotateCcw className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">Sin devoluciones</p>
          <p className="mt-1 text-xs text-slate-400">
            No hay registros con los filtros seleccionados
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Factura
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Motivo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Crédito
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {devoluciones.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/facturas/${dev.factura.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {dev.factura.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{dev.cliente?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{TIPO_LABELS[dev.tipo] ?? dev.tipo}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{dev.motivo}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-xs', ESTADO_COLORS[dev.estado])}>
                      {ESTADO_LABELS[dev.estado]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {dev.montoCredito != null
                      ? `RD$ ${Number(dev.montoCredito).toLocaleString('es-DO')}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">
                    {new Date(dev.createdAt).toLocaleDateString('es-DO', {
                      day: '2-digit',
                      month: 'short',
                    })}
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
