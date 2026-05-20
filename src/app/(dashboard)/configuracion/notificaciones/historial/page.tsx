'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, CheckCircle, XCircle, Clock, Ban } from 'lucide-react';

interface Notificacion {
  id: string;
  tipo: string;
  canal: string;
  estado: string;
  destinatario: string;
  asunto: string | null;
  errorMsg: string | null;
  enviadaEn: string | null;
  createdAt: string;
}

const TIPO_LABELS: Record<string, string> = {
  FACTURA_EMITIDA: 'Factura emitida',
  FACTURA_VENCIDA: 'Factura vencida',
  PAGO_RECIBIDO: 'Pago recibido',
  CITA_RECORDATORIO: 'Recordatorio cita',
  STOCK_BAJO: 'Stock bajo',
  NOMINA_PROCESADA: 'Nómina procesada',
  BIENVENIDA: 'Bienvenida',
};

const CANAL_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  AMBOS: 'Ambos',
};

function EstadoBadge({ estado }: { estado: string }) {
  switch (estado) {
    case 'ENVIADA':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          <CheckCircle className="h-3 w-3" /> Enviada
        </span>
      );
    case 'FALLIDA':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          <XCircle className="h-3 w-3" /> Fallida
        </span>
      );
    case 'PENDIENTE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          <Clock className="h-3 w-3" /> Pendiente
        </span>
      );
    case 'CANCELADA':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          <Ban className="h-3 w-3" /> Cancelada
        </span>
      );
    default:
      return <span className="text-xs text-slate-500">{estado}</span>;
  }
}

function formatFecha(f: string) {
  return new Date(f).toLocaleString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistorialNotificacionesPage() {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const cargar = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (tipo) params.set('tipo', tipo);
    if (estado) params.set('estado', estado);
    try {
      const res = await fetch(`/api/notificaciones?${params}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
        setTotal(json.meta?.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, tipo, estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cancelar = async (id: string) => {
    await fetch(`/api/notificaciones/${id}`, { method: 'DELETE' });
    cargar();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/configuracion/notificaciones"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de notificaciones</h1>
          <p className="text-sm text-slate-500">{total} registros en total</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-3">
        <select
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="ENVIADA">Enviada</option>
          <option value="FALLIDA">Fallida</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Cargando historial...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">No hay notificaciones en este período.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Canal</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Destinatario</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Estado</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Error</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500">{formatFecha(n.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">
                        {TIPO_LABELS[n.tipo] ?? n.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{CANAL_LABELS[n.canal] ?? n.canal}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-600">
                      {n.destinatario}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={n.estado} />
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-xs text-red-600">
                      {n.errorMsg ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(n.estado === 'PENDIENTE' || n.estado === 'FALLIDA') && (
                        <button
                          onClick={() => cancelar(n.id)}
                          className="text-xs text-slate-500 hover:text-red-600 hover:underline"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
