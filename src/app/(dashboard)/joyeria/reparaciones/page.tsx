'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Wrench, Plus, Clock } from 'lucide-react';

const ESTADO_CONFIG: Record<string, { label: string; clase: string }> = {
  RECIBIDA: { label: 'Recibida', clase: 'bg-slate-100 text-slate-700' },
  EN_PROCESO: { label: 'En proceso', clase: 'bg-blue-100 text-blue-800' },
  LISTA: { label: 'Lista', clase: 'bg-emerald-100 text-emerald-800' },
  ENTREGADA: { label: 'Entregada', clase: 'bg-slate-100 text-slate-500' },
};

interface Reparacion {
  id: string;
  clienteNombre: string;
  descripcion: string;
  presupuesto: number | null;
  costoFinal: number | null;
  estado: string;
  fechaPromesa: string | null;
  createdAt: string;
  pieza: { codigo: string; nombre: string } | null;
}

export default function ReparacionesPage() {
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const cargar = useCallback(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (estadoFiltro) params.set('estado', estadoFiltro);
    fetch(`/api/joyeria/reparaciones?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReparaciones(d.data);
      })
      .finally(() => setCargando(false));
  }, [estadoFiltro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const formatFecha = (s: string) => new Date(s).toLocaleDateString('es-DO');

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reparaciones</h1>
          <p className="text-sm text-slate-500">{reparaciones.length} reparaciones</p>
        </div>
        <Link
          href="/joyeria/reparaciones/nueva"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva reparación
        </Link>
      </div>

      <div className="mb-4 flex gap-3">
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([v, { label }]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {cargando ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : reparaciones.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Wrench className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-400">No hay reparaciones</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Pieza</th>
                <th className="px-4 py-3 text-right">Presupuesto</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fecha promesa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reparaciones.map((r) => {
                const estadoCfg = ESTADO_CONFIG[r.estado] ?? ESTADO_CONFIG.RECIBIDA;
                const vencida =
                  r.fechaPromesa &&
                  r.estado !== 'ENTREGADA' &&
                  new Date(r.fechaPromesa) < new Date();
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link
                        href={`/joyeria/reparaciones/${r.id}`}
                        className="hover:text-indigo-700"
                      >
                        {r.clienteNombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.descripcion}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {r.pieza ? `${r.pieza.codigo}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {r.presupuesto != null
                        ? `RD$ ${Number(r.presupuesto).toLocaleString('es-DO')}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoCfg.clase}`}
                      >
                        {estadoCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.fechaPromesa ? (
                        <span
                          className={`flex items-center gap-1 text-xs ${vencida ? 'text-red-600 font-medium' : 'text-slate-500'}`}
                        >
                          {vencida && <Clock className="h-3 w-3" />}
                          {formatFecha(r.fechaPromesa)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
