'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Clock } from 'lucide-react';

type EstadoItem = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'CANCELADO';

interface ItemCocina {
  id: string;
  nombre: string;
  cantidad: number;
  notas: string | null;
  estado: EstadoItem;
  comanda: {
    id: string;
    numero: number;
    mesa: { numero: number; nombre: string | null } | null;
    mesero: string | null;
  };
}

const COLUMNAS: { estado: EstadoItem; label: string; color: string; bg: string }[] = [
  {
    estado: 'PENDIENTE',
    label: 'Pendiente',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
  {
    estado: 'EN_PREPARACION',
    label: 'En preparación',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    estado: 'LISTO',
    label: 'Listo',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
  },
];

const SIGUIENTE_ESTADO: Partial<Record<EstadoItem, EstadoItem>> = {
  PENDIENTE: 'EN_PREPARACION',
  EN_PREPARACION: 'LISTO',
};

const BOTON_LABEL: Partial<Record<EstadoItem, string>> = {
  PENDIENTE: 'Iniciar',
  EN_PREPARACION: 'Marcar listo',
};

export default function CocinaPage() {
  const [items, setItems] = useState<ItemCocina[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/restaurante/cocina');
      const data = await res.json();
      if (data.success) setItems(data.data);
    } finally {
      setLoading(false);
      setSegundos(30);
    }
  }, []);

  useEffect(() => {
    cargar();

    intervalRef.current = setInterval(cargar, 30_000);
    countdownRef.current = setInterval(() => {
      setSegundos((s) => (s <= 1 ? 30 : s - 1));
    }, 1_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [cargar]);

  async function avanzarEstado(itemId: string, estadoActual: EstadoItem) {
    const siguiente = SIGUIENTE_ESTADO[estadoActual];
    if (!siguiente) return;

    setActualizando(itemId);
    try {
      await fetch(`/api/restaurante/cocina/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: siguiente }),
      });
      await cargar();
    } finally {
      setActualizando(null);
    }
  }

  function getItemsPorEstado(estado: EstadoItem) {
    return items.filter((i) => i.estado === estado);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vista de Cocina</h1>
          <p className="text-slate-500 text-sm mt-1">Ítems activos por estado</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Clock className="h-4 w-4" />
            <span>Actualiza en {segundos}s</span>
          </div>
          <button
            onClick={cargar}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title="Actualizar ahora"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {COLUMNAS.map(({ estado, label, color, bg }) => {
            const columnaItems = getItemsPorEstado(estado);
            return (
              <div key={estado} className="flex flex-col gap-3">
                {/* Header columna */}
                <div
                  className={`rounded-xl border px-4 py-2.5 flex items-center justify-between ${bg}`}
                >
                  <span className={`font-semibold text-sm ${color}`}>{label}</span>
                  <span className={`text-xs font-bold ${color} bg-white rounded-full px-2 py-0.5`}>
                    {columnaItems.length}
                  </span>
                </div>

                {/* Ítems */}
                <div className="space-y-3 flex-1">
                  {columnaItems.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 h-24 flex items-center justify-center">
                      <p className="text-xs text-slate-400">Sin ítems</p>
                    </div>
                  ) : (
                    columnaItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-slate-800">
                                {item.cantidad}×
                              </span>
                              <span className="font-semibold text-slate-800 text-sm truncate">
                                {item.nombre}
                              </span>
                            </div>
                            {item.notas && (
                              <p className="text-xs text-amber-600 mt-0.5 bg-amber-50 rounded px-1.5 py-0.5">
                                {item.notas}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <p className="text-xs text-slate-500">
                            #{item.comanda.numero}
                            {item.comanda.mesa ? ` · Mesa ${item.comanda.mesa.numero}` : ''}
                            {item.comanda.mesero ? ` · ${item.comanda.mesero}` : ''}
                          </p>
                          {SIGUIENTE_ESTADO[item.estado] && (
                            <button
                              onClick={() => avanzarEstado(item.id, item.estado)}
                              disabled={actualizando === item.id}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
                            >
                              {actualizando === item.id ? '...' : BOTON_LABEL[item.estado]}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
