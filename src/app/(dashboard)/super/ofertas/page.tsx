'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Tag, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Oferta {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioOriginal: string;
  precioOferta: string;
  descuento: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  producto: { id: string; nombre: string; sku: string | null };
  categoria: { id: string; nombre: string } | null;
}

type Tab = 'activas' | 'programadas' | 'vencidas';

function clasificar(o: Oferta): Tab {
  const now = new Date();
  const inicio = new Date(o.fechaInicio);
  const fin = new Date(o.fechaFin);
  if (fin < now) return 'vencidas';
  if (inicio > now) return 'programadas';
  return 'activas';
}

function diasRestantes(fecha: string) {
  const diff = new Date(fecha).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function OfertasPage() {
  const [todas, setTodas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('activas');

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/super/ofertas?filtro=todas');
      const json = await res.json();
      if (json.success) setTodas(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const desactivar = async (id: string) => {
    await fetch(`/api/super/ofertas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: false }),
    });
    cargar();
  };

  const activas = todas.filter((o) => clasificar(o) === 'activas' && o.activa);
  const programadas = todas.filter((o) => clasificar(o) === 'programadas' && o.activa);
  const vencidas = todas.filter((o) => clasificar(o) === 'vencidas' || !o.activa);

  const now = new Date();
  const vencenEsta = todas.filter((o) => {
    const fin = new Date(o.fechaFin);
    const diff = fin.getTime() - now.getTime();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000 && o.activa;
  });

  const mostrar = tab === 'activas' ? activas : tab === 'programadas' ? programadas : vencidas;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ofertas</h1>
          <p className="text-sm text-slate-500">Precios especiales con vigencia automática</p>
        </div>
        <Link
          href="/super/ofertas/nueva"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva oferta
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Activas hoy</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{activas.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Próximas a vencer</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-700">{vencenEsta.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">Vencidas</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-600">{vencidas.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {(
          [
            ['activas', 'Activas', activas.length],
            ['programadas', 'Programadas', programadas.length],
            ['vencidas', 'Vencidas', vencidas.length],
          ] as [Tab, string, number][]
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}{' '}
            <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs">{count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Cargando ofertas...</div>
      ) : mostrar.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
          <Tag className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-slate-500">No hay ofertas en esta categoría.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Producto</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Precio original</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Precio oferta</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Descuento</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Vigencia</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mostrar.map((o) => {
                const dias = diasRestantes(o.fechaFin);
                const estaActiva = clasificar(o) === 'activas' && o.activa;
                const proxima = estaActiva && dias <= 3;

                return (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{o.producto.nombre}</div>
                      <div className="text-xs text-slate-400">{o.nombre}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 line-through">
                      RD${Number(o.precioOriginal).toLocaleString('es-DO')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      RD${Number(o.precioOferta).toLocaleString('es-DO')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                        -{Math.round(Number(o.descuento))}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{formatFecha(o.fechaInicio)}</div>
                      <div>→ {formatFecha(o.fechaFin)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {!o.activa ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          Inactiva
                        </span>
                      ) : clasificar(o) === 'vencidas' ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          Vencida
                        </span>
                      ) : proxima ? (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                          Vence en {dias}d
                        </span>
                      ) : estaActiva ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Activa
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          Programada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.activa && (
                        <button
                          onClick={() => desactivar(o.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Desactivar
                        </button>
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
