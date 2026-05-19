import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Plus } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buttonVariants } from '@/components/ui/button';

const INDUSTRIAS_SALON = ['SALON_BARBERIA'];

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-slate-100 border-slate-300 text-slate-700',
  CONFIRMADA: 'bg-blue-100 border-blue-300 text-blue-800',
  EN_PROCESO: 'bg-amber-100 border-amber-300 text-amber-800',
  COMPLETADA: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  CANCELADA: 'bg-red-50 border-red-200 text-red-600 opacity-60',
  NO_SHOW: 'bg-slate-50 border-slate-200 text-slate-500 opacity-60',
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_SHOW: 'No se presentó',
};

const HORAS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am - 8pm

interface SearchParams {
  fecha?: string;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_SALON.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const params = await searchParams;
  const hoy = new Date();
  const fechaStr =
    params.fecha ??
    `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const inicio = new Date(`${fechaStr}T00:00:00`);
  const fin = new Date(`${fechaStr}T23:59:59`);

  const citas = await prisma.cita.findMany({
    where: {
      empresaId: sesion.empresaActivaId,
      fecha: { gte: inicio, lte: fin },
    },
    orderBy: { fecha: 'asc' },
  });

  const fechaDisplay = new Date(`${fechaStr}T12:00:00`).toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const prevDate = new Date(`${fechaStr}T12:00:00`);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(`${fechaStr}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + 1);

  function toDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
            {fechaDisplay}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {citas.length} cita{citas.length !== 1 ? 's' : ''} programada
            {citas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/salon/agenda?fecha=${toDateStr(prevDate)}`}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-200 hover:bg-slate-50"
          >
            ‹ Anterior
          </Link>
          <Link
            href="/salon/agenda"
            className="px-3 py-1.5 text-sm rounded-md border border-slate-200 hover:bg-slate-50"
          >
            Hoy
          </Link>
          <Link
            href={`/salon/agenda?fecha=${toDateStr(nextDate)}`}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-200 hover:bg-slate-50"
          >
            Siguiente ›
          </Link>
          <Link href="/salon/citas/nueva" className={buttonVariants()}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva cita
          </Link>
        </div>
      </div>

      {citas.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-16 text-center text-slate-500">
          <CalendarDays className="mx-auto h-10 w-10 mb-3 text-slate-300" />
          <p className="font-medium">Sin citas para este día</p>
          <p className="text-sm mt-1">Agenda una nueva cita para comenzar.</p>
          <Link href="/salon/citas/nueva" className={buttonVariants() + ' mt-4'}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva cita
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Grid de horas */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Cabecera de horas */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <div className="w-16 shrink-0" />
                {HORAS.map((h) => (
                  <div
                    key={h}
                    className="flex-1 text-center text-xs text-slate-400 py-2 border-l border-slate-100"
                  >
                    {h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}
                  </div>
                ))}
              </div>

              {/* Citas como tarjetas por hora */}
              <div className="relative">
                {citas.map((cita) => {
                  const fecha = new Date(cita.fecha);
                  const hora = fecha.getHours() + fecha.getMinutes() / 60;
                  const offsetFromStart = hora - 8;
                  const totalHours = HORAS.length;
                  const left = `calc(4rem + ${(offsetFromStart / totalHours) * (100 - ((4 * 16) / 700) * 100)}%)`;
                  const width = `${(cita.duracionMin / 60 / totalHours) * 85}%`;

                  return (
                    <Link
                      key={cita.id}
                      href={`/salon/citas/${cita.id}`}
                      className={`absolute top-2 rounded border p-2 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer ${ESTADO_COLORS[cita.estado]}`}
                      style={{ left, width, minWidth: '80px' }}
                    >
                      <p className="truncate font-semibold">{cita.clienteNombre}</p>
                      <p className="truncate opacity-80">{cita.servicio}</p>
                      <p className="opacity-70">
                        {fecha.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {cita.duracionMin}min
                      </p>
                    </Link>
                  );
                })}
                <div className="h-20" />
              </div>
            </div>
          </div>

          {/* Lista debajo */}
          <div className="border-t border-slate-200">
            {citas.map((cita) => (
              <Link
                key={cita.id}
                href={`/salon/citas/${cita.id}`}
                className="flex items-center gap-4 px-5 py-3 border-b border-slate-100 hover:bg-slate-50 last:border-0"
              >
                <div className="w-14 shrink-0 text-center">
                  <p className="text-sm font-bold text-slate-800">
                    {new Date(cita.fecha).toLocaleTimeString('es-DO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-slate-400">{cita.duracionMin}min</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{cita.clienteNombre}</p>
                  <p className="text-sm text-slate-500 truncate">{cita.servicio}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">
                    RD$ {Number(cita.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[cita.estado]}`}
                  >
                    {ESTADO_LABELS[cita.estado]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
