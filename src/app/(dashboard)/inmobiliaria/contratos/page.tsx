'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, AlertTriangle } from 'lucide-react';

const AHORA = Date.now();

const ESTADO_CLASE: Record<string, string> = {
  ACTIVO: 'bg-emerald-100 text-emerald-800',
  VENCIDO: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-slate-100 text-slate-600',
  POR_VENCER: 'bg-yellow-100 text-yellow-800',
};

interface Contrato {
  id: string;
  inquilinoNombre: string;
  montoMensual: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  propiedad: { codigo: string; nombre: string; tipo: string };
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const cargar = useCallback(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (estadoFiltro) params.set('estado', estadoFiltro);
    fetch(`/api/inmobiliaria/contratos?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setContratos(d.data);
      })
      .finally(() => setCargando(false));
  }, [estadoFiltro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const porVencer = contratos.filter((c) => {
    if (c.estado !== 'ACTIVO') return false;
    const dias = (new Date(c.fechaFin).getTime() - AHORA) / 86400000;
    return dias <= 30 && dias >= 0;
  });

  const formatFecha = (s: string) => new Date(s).toLocaleDateString('es-DO');

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contratos</h1>
          <p className="text-sm text-slate-500">{contratos.length} contratos</p>
        </div>
        <Link
          href="/inmobiliaria/contratos/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo contrato
        </Link>
      </div>

      {porVencer.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            <strong>
              {porVencer.length} contrato{porVencer.length > 1 ? 's' : ''}
            </strong>{' '}
            vence{porVencer.length > 1 ? 'n' : ''} en los próximos 30 días.
          </p>
        </div>
      )}

      <div className="mb-4">
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="POR_VENCER">Por vencer</option>
          <option value="VENCIDO">Vencido</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      {cargando ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : contratos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="text-slate-400">No hay contratos</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Propiedad</th>
                <th className="px-4 py-3 text-left">Inquilino</th>
                <th className="px-4 py-3 text-left">Inicio</th>
                <th className="px-4 py-3 text-left">Vence</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contratos.map((c) => {
                const diasRestantes = (new Date(c.fechaFin).getTime() - AHORA) / 86400000;
                const porVencerEste =
                  c.estado === 'ACTIVO' && diasRestantes <= 30 && diasRestantes >= 0;
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50 transition-colors ${porVencerEste ? 'bg-yellow-50/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/inmobiliaria/contratos/${c.id}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {c.propiedad.codigo}
                      </Link>
                      <p className="text-xs text-slate-400">{c.propiedad.nombre}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.inquilinoNombre}</td>
                    <td className="px-4 py-3 text-slate-500">{formatFecha(c.fechaInicio)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={porVencerEste ? 'font-medium text-yellow-700' : 'text-slate-500'}
                      >
                        {formatFecha(c.fechaFin)}
                      </span>
                      {porVencerEste && (
                        <span className="ml-1 text-xs text-yellow-600">
                          ({Math.ceil(diasRestantes)}d)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      RD$ {Number(c.montoMensual).toLocaleString('es-DO')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_CLASE[c.estado] ?? ''}`}
                      >
                        {c.estado}
                      </span>
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
