'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';

interface Consulta {
  id: string;
  fechaHora: string;
  medicoNombre: string;
  motivo: string | null;
  estado: string;
  precio: string | null;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    numeroExpediente: string;
    tipoSangre: string | null;
  };
}

const ESTADO_COLOR: Record<string, string> = {
  PROGRAMADA: 'border-l-blue-500 bg-blue-50',
  EN_CURSO: 'border-l-amber-500 bg-amber-50',
  COMPLETADA: 'border-l-emerald-500 bg-emerald-50',
  CANCELADA: 'border-l-red-300 bg-red-50 opacity-60',
  NO_ASISTIO: 'border-l-slate-300 bg-slate-50 opacity-60',
};

const HORAS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am a 8pm

function AgendaContent() {
  const searchParams = useSearchParams();
  const hoy = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(searchParams.get('fecha') ?? hoy);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/clinica/agenda?fecha=${fecha}`);
        const j = await r.json();
        if (j.success) setConsultas(j.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fecha]);

  const navegar = (dias: number) => {
    const d = new Date(fecha);
    d.setDate(d.getDate() + dias);
    setFecha(d.toISOString().split('T')[0]);
  };

  const consultasPorHora = (hora: number) =>
    consultas.filter((c) => new Date(c.fechaHora).getHours() === hora);

  const totalProgramadas = consultas.filter((c) => c.estado === 'PROGRAMADA').length;
  const totalCompletadas = consultas.filter((c) => c.estado === 'COMPLETADA').length;

  return (
    <div className="p-6">
      {/* Cabecera */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda médica</h1>
          <p className="text-sm text-slate-500">
            {totalProgramadas} programadas · {totalCompletadas} completadas
          </p>
        </div>
        <Link
          href="/clinica/consultas/nueva"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva consulta
        </Link>
      </div>

      {/* Selector de fecha */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navegar(-1)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => navegar(1)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => setFecha(hoy)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Hoy
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Cargando agenda...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {consultas.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p>No hay consultas programadas para este día.</p>
              <Link
                href={`/clinica/consultas/nueva`}
                className="mt-2 inline-block text-sm text-indigo-600 hover:underline"
              >
                Programar consulta
              </Link>
            </div>
          )}
          {consultas.length > 0 && (
            <div>
              {HORAS.map((hora) => {
                const citasHora = consultasPorHora(hora);
                if (citasHora.length === 0 && consultas.length > 0) {
                  return (
                    <div key={hora} className="flex border-b border-slate-100 last:border-0">
                      <div className="w-16 shrink-0 border-r border-slate-100 px-3 py-3 text-xs text-slate-400">
                        {hora}:00
                      </div>
                      <div className="flex-1 py-3 px-4" />
                    </div>
                  );
                }
                return (
                  <div key={hora} className="flex border-b border-slate-100 last:border-0">
                    <div className="w-16 shrink-0 border-r border-slate-100 px-3 py-3 text-xs font-medium text-slate-500">
                      {hora}:00
                    </div>
                    <div className="flex-1 space-y-2 px-4 py-3">
                      {citasHora.map((c) => (
                        <Link
                          key={c.id}
                          href={`/clinica/consultas/${c.id}`}
                          className={`block rounded-lg border-l-4 p-3 transition-all hover:shadow-sm ${ESTADO_COLOR[c.estado] ?? 'border-l-slate-300 bg-slate-50'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-slate-900 text-sm">
                                {c.paciente.nombre} {c.paciente.apellido}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(c.fechaHora).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                                {' · '}Dr./Dra. {c.medicoNombre}
                              </p>
                              {c.motivo && <p className="mt-0.5 text-xs text-slate-600">{c.motivo}</p>}
                            </div>
                            {c.precio && (
                              <span className="shrink-0 text-xs font-semibold text-slate-700">
                                RD${Number(c.precio).toLocaleString('es-DO')}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgendaPage() {
  return (
    <Suspense>
      <AgendaContent />
    </Suspense>
  );
}
