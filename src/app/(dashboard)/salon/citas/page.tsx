import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock, Plus } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const INDUSTRIAS_SALON = ['SALON_BARBERIA'];

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_SHOW: 'No se presentó',
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-slate-100 text-slate-600',
  CONFIRMADA: 'bg-blue-100 text-blue-700',
  EN_PROCESO: 'bg-amber-100 text-amber-700',
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-red-100 text-red-600',
  NO_SHOW: 'bg-slate-100 text-slate-500',
};

interface SearchParams {
  fecha?: string;
  estado?: string;
}

export default async function CitasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_SALON.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { fecha, estado } = await searchParams;

  const citas = await prisma.cita.findMany({
    where: {
      empresaId: sesion.empresaActivaId,
      ...(estado ? { estado: estado as never } : {}),
      ...(fecha
        ? {
            fecha: {
              gte: new Date(`${fecha}T00:00:00`),
              lte: new Date(`${fecha}T23:59:59`),
            },
          }
        : {}),
    },
    orderBy: { fecha: 'desc' },
  });

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Citas</h1>
          <p className="text-slate-500 text-sm mt-1">
            {citas.length} cita{citas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/salon/citas/nueva" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva cita
        </Link>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Fecha</label>
          <input
            name="fecha"
            type="date"
            defaultValue={fecha ?? ''}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Estado</label>
          <select
            name="estado"
            defaultValue={estado ?? ''}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Todos</option>
            {Object.keys(ESTADO_LABELS).map((e) => (
              <option key={e} value={e}>
                {ESTADO_LABELS[e]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700"
        >
          Filtrar
        </button>
        {(fecha || estado) && (
          <Link
            href="/salon/citas"
            className="px-4 py-1.5 text-sm border border-slate-200 rounded-md hover:bg-slate-50"
          >
            Limpiar
          </Link>
        )}
      </form>

      {citas.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-16 text-center text-slate-500">
          <Clock className="mx-auto h-10 w-10 mb-3 text-slate-300" />
          <p className="font-medium">Sin citas</p>
          <p className="text-sm mt-1">Agenda la primera cita.</p>
          <Link href="/salon/citas/nueva" className={buttonVariants() + ' mt-4'}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva cita
          </Link>
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Servicio</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Fecha y hora</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Duración</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Precio</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.clienteNombre}</td>
                  <td className="px-4 py-3 text-slate-700">{c.servicio}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                    {new Date(c.fecha).toLocaleString('es-DO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">{c.duracionMin}min</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    RD$ {Number(c.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={ESTADO_COLORS[c.estado]}>{ESTADO_LABELS[c.estado]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/salon/citas/${c.id}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Ver
                    </Link>
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
