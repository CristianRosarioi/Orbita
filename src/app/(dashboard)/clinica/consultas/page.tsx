'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Stethoscope, Plus, Calendar } from 'lucide-react';

interface Consulta {
  id: string;
  fechaHora: string;
  medicoNombre: string;
  motivo: string | null;
  estado: string;
  precio: string | null;
  facturaId: string | null;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    numeroExpediente: string;
  };
}

const ESTADO_COLOR: Record<string, string> = {
  PROGRAMADA: 'bg-blue-100 text-blue-700',
  EN_CURSO: 'bg-amber-100 text-amber-700',
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-red-100 text-red-700',
  NO_ASISTIO: 'bg-slate-100 text-slate-600',
};

const ESTADO_LABEL: Record<string, string> = {
  PROGRAMADA: 'Programada',
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
};

export default function ConsultasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState('');
  const [estado, setEstado] = useState('');
  const [medico, setMedico] = useState('');

  const cargar = useCallback(async () => {
    const params = new URLSearchParams({ limit: '30' });
    if (fecha) params.set('fecha', fecha);
    if (estado) params.set('estado', estado);
    if (medico) params.set('medico', medico);
    try {
      const res = await fetch(`/api/clinica/consultas?${params}`);
      const json = await res.json();
      if (json.success) setConsultas(json.data);
    } finally {
      setLoading(false);
    }
  }, [fecha, estado, medico]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultas</h1>
          <p className="text-sm text-slate-500">Historial y programación de consultas</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/clinica/agenda?fecha=${hoy}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4" />
            Agenda
          </Link>
          <Link
            href="/clinica/consultas/nueva"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Nueva consulta
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="PROGRAMADA">Programada</option>
          <option value="EN_CURSO">En curso</option>
          <option value="COMPLETADA">Completada</option>
          <option value="CANCELADA">Cancelada</option>
          <option value="NO_ASISTIO">No asistió</option>
        </select>
        <input
          type="text"
          value={medico}
          onChange={(e) => setMedico(e.target.value)}
          placeholder="Filtrar por médico..."
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {(fecha || estado || medico) && (
          <button
            onClick={() => {
              setFecha('');
              setEstado('');
              setMedico('');
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Limpiar
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Cargando consultas...</div>
      ) : consultas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <Stethoscope className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-500">No hay consultas que mostrar.</p>
          <Link
            href="/clinica/consultas/nueva"
            className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
          >
            Registrar consulta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {consultas.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {c.paciente.nombre} {c.paciente.apellido}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      #{c.paciente.numeroExpediente}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLOR[c.estado] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {ESTADO_LABEL[c.estado] ?? c.estado}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {new Date(c.fechaHora).toLocaleDateString('es-DO', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' · '}Dr./Dra. {c.medicoNombre}
                  </p>
                  {c.motivo && <p className="mt-1 text-sm text-slate-600">{c.motivo}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {c.precio && (
                    <span className="text-sm font-semibold text-slate-900">
                      RD${Number(c.precio).toLocaleString('es-DO')}
                    </span>
                  )}
                  <Link
                    href={`/clinica/consultas/${c.id}`}
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
