import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INDUSTRIAS_REPUESTOS = ['REPUESTOS'];

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  FACTURADA: 'Facturada',
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  APROBADA: 'bg-emerald-100 text-emerald-700',
  RECHAZADA: 'bg-red-100 text-red-700',
  FACTURADA: 'bg-blue-100 text-blue-700',
};

const TODOS_ESTADOS = ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'FACTURADA'];

interface SearchParams { estado?: string; }

export default async function CotizacionesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_REPUESTOS.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { estado } = await searchParams;

  const cotizaciones = await prisma.cotizacion.findMany({
    where: {
      empresaId: sesion.empresaActivaId,
      ...(estado ? { estado: estado as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      cliente: { select: { id: true, nombre: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <FileText className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Cotizaciones</h1>
            <p className="text-sm text-slate-500">{cotizaciones.length} cotización{cotizaciones.length !== 1 ? 'es' : ''}</p>
          </div>
        </div>
        <Link href="/repuestos/cotizaciones/nueva" className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}>
          <Plus className="h-4 w-4" />
          Nueva cotización
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/repuestos/cotizaciones"
          className={cn('rounded-full px-3 py-1 text-xs font-medium', !estado ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
        >
          Todas
        </Link>
        {TODOS_ESTADOS.map((e) => (
          <Link
            key={e}
            href={`/repuestos/cotizaciones?estado=${e}`}
            className={cn('rounded-full px-3 py-1 text-xs font-medium', estado === e ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
          >
            {ESTADO_LABELS[e]}
          </Link>
        ))}
      </div>

      {cotizaciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">Sin cotizaciones</p>
          <Link href="/repuestos/cotizaciones/nueva" className={cn(buttonVariants({ size: 'sm' }), 'mt-4 gap-2')}>
            <Plus className="h-4 w-4" />
            Crear primera cotización
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Vehículo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Ítems</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cotizaciones.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/repuestos/cotizaciones/${c.id}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                      #{c.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{c.clienteNombre}</p>
                    {c.clienteTelefono && <p className="text-xs text-slate-400">{c.clienteTelefono}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">
                    {[c.vehiculoMarca, c.vehiculoModelo, c.vehiculoAnio, c.vehiculoPlaca]
                      .filter(Boolean)
                      .join(' · ')}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">{c._count.items}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-xs', ESTADO_COLORS[c.estado])}>
                      {ESTADO_LABELS[c.estado]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    RD$ {Number(c.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
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
