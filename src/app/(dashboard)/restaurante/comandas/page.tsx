'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type EstadoComanda = 'ABIERTA' | 'LISTA' | 'SERVIDA' | 'CANCELADA';

interface Comanda {
  id: string;
  numero: number;
  mesero: string | null;
  personas: number;
  estado: EstadoComanda;
  subtotal: number;
  itbis: number;
  propina: number;
  total: number;
  createdAt: string;
  mesa: { numero: number; nombre: string | null } | null;
  _count: { items: number };
}

const FILTROS: { label: string; value: EstadoComanda | 'TODAS' }[] = [
  { label: 'Todas', value: 'TODAS' },
  { label: 'Abiertas', value: 'ABIERTA' },
  { label: 'Listas', value: 'LISTA' },
  { label: 'Servidas', value: 'SERVIDA' },
  { label: 'Canceladas', value: 'CANCELADA' },
];

const ESTADO_BADGE: Record<EstadoComanda, string> = {
  ABIERTA: 'bg-blue-100 text-blue-700',
  LISTA: 'bg-emerald-100 text-emerald-700',
  SERVIDA: 'bg-slate-100 text-slate-600',
  CANCELADA: 'bg-red-100 text-red-600',
};

const ESTADO_LABEL: Record<EstadoComanda, string> = {
  ABIERTA: 'Abierta',
  LISTA: 'Lista',
  SERVIDA: 'Servida',
  CANCELADA: 'Cancelada',
};

export default function ComandasPage() {
  const router = useRouter();
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [filtro, setFiltro] = useState<EstadoComanda | 'TODAS'>('TODAS');
  const [loading, setLoading] = useState(true);

  const cargarComandas = useCallback(async () => {
    try {
      const params = filtro !== 'TODAS' ? `?estado=${filtro}` : '';
      const res = await fetch(`/api/restaurante/comandas${params}`);
      const data = await res.json();
      if (data.success) setComandas(data.data);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargarComandas();
  }, [cargarComandas]);

  function formatHora(iso: string) {
    return new Date(iso).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Comandas</h1>
          <p className="text-slate-500 text-sm mt-1">Historial de órdenes del restaurante</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarComandas}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link href="/restaurante/mesas">
            <Button variant="outline">
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Ver mesas
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTROS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFiltro(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : comandas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-semibold text-slate-700">Sin comandas</p>
          <p className="text-sm text-slate-400 mt-1">
            {filtro === 'TODAS'
              ? 'Aún no hay comandas registradas.'
              : `No hay comandas con estado "${ESTADO_LABEL[filtro as EstadoComanda]}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Mesa</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Mesero</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Personas</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Ítems</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comandas.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/restaurante/comandas/${c.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">#{c.numero}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.mesa
                      ? `Mesa ${c.mesa.numero}${c.mesa.nombre ? ` — ${c.mesa.nombre}` : ''}`
                      : 'Sin mesa'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.mesero ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{c.personas}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{c._count.items}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    RD$ {Number(c.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_BADGE[c.estado]}`}
                    >
                      {ESTADO_LABEL[c.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{formatHora(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
