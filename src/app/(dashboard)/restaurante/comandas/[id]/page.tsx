'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgregarItemComanda } from '@/components/shared/agregar-item-comanda';

type EstadoComanda = 'ABIERTA' | 'LISTA' | 'SERVIDA' | 'CANCELADA';
type EstadoItem = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'CANCELADO';

interface ItemComanda {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  notas: string | null;
  estado: EstadoItem;
}

interface ComandaDetalle {
  id: string;
  numero: number;
  mesero: string | null;
  personas: number;
  estado: EstadoComanda;
  notas: string | null;
  subtotal: number;
  itbis: number;
  propina: number;
  total: number;
  createdAt: string;
  mesa: { id: string; numero: number; nombre: string | null } | null;
  items: ItemComanda[];
}

const ESTADO_ITEM_BADGE: Record<EstadoItem, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  EN_PREPARACION: 'bg-blue-100 text-blue-700',
  LISTO: 'bg-emerald-100 text-emerald-700',
  CANCELADO: 'bg-slate-100 text-slate-500 line-through',
};

const ESTADO_ITEM_LABEL: Record<EstadoItem, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  CANCELADO: 'Cancelado',
};

export default function ComandaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [comanda, setComanda] = useState<ComandaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [accionando, setAccionando] = useState(false);
  const [propina, setPropina] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurante/comandas/${id}`);
      const data = await res.json();
      if (data.success) {
        setComanda(data.data);
        setPropina(String(data.data.propina ?? ''));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function actualizarEstado(estado: EstadoComanda) {
    setAccionando(true);
    setError('');
    try {
      const body: Record<string, unknown> = { estado };
      if (estado === 'SERVIDA') {
        const p = parseFloat(propina);
        if (!isNaN(p) && p > 0) body.propina = p;
      }
      const res = await fetch(`/api/restaurante/comandas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al actualizar.');
        return;
      }
      await cargar();
      if (estado === 'CANCELADA') router.push('/restaurante/mesas');
    } catch {
      setError('Error de conexión.');
    } finally {
      setAccionando(false);
    }
  }

  async function facturar() {
    setAccionando(true);
    setError('');
    try {
      const body: Record<string, unknown> = {};
      const p = parseFloat(propina);
      if (!isNaN(p) && p > 0) body.propina = p;
      const res = await fetch(`/api/restaurante/comandas/${id}/facturar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al facturar.');
        return;
      }
      router.push('/restaurante/mesas');
    } catch {
      setError('Error de conexión.');
    } finally {
      setAccionando(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 rounded-lg bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!comanda) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-slate-500">Comanda no encontrada.</p>
      </div>
    );
  }

  const esEditable = comanda.estado === 'ABIERTA';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Comanda #{comanda.numero}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {comanda.mesa
                ? `Mesa ${comanda.mesa.numero}${comanda.mesa.nombre ? ` — ${comanda.mesa.nombre}` : ''}`
                : 'Sin mesa'}
              {comanda.mesero ? ` · ${comanda.mesero}` : ''}
              {` · ${comanda.personas} persona${comanda.personas !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {comanda.estado === 'ABIERTA' && (
          <Button variant="outline" onClick={() => actualizarEstado('LISTA')} disabled={accionando}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Marcar lista
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ítems */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="font-semibold text-slate-800 text-sm">Ítems ({comanda.items.length})</p>
            </div>
            {comanda.items.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">
                Sin ítems. Agrega productos a la comanda.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {comanda.items.map((item) => (
                  <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 flex-shrink-0">
                      {item.cantidad}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium text-slate-800 truncate ${item.estado === 'CANCELADO' ? 'line-through text-slate-400' : ''}`}
                      >
                        {item.nombre}
                      </p>
                      {item.notas && (
                        <p className="text-xs text-slate-400 truncate">{item.notas}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${ESTADO_ITEM_BADGE[item.estado]}`}
                    >
                      {ESTADO_ITEM_LABEL[item.estado]}
                    </span>
                    <p className="text-sm font-semibold text-slate-700 flex-shrink-0 w-24 text-right">
                      RD${' '}
                      {Number(item.subtotal).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {esEditable && <AgregarItemComanda comandaId={id} onItemAgregado={cargar} />}
        </div>

        {/* Panel lateral — Totales y acciones */}
        <div className="space-y-4">
          {/* Totales */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <p className="font-semibold text-slate-800 text-sm">Resumen</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>
                  RD${' '}
                  {Number(comanda.subtotal).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ITBIS (18%)</span>
                <span>
                  RD$ {Number(comanda.itbis).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {comanda.propina > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Propina</span>
                  <span>
                    RD${' '}
                    {Number(comanda.propina).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>
                  RD$ {Number(comanda.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {(esEditable || comanda.estado === 'LISTA') && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Propina (RD$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={propina}
                  onChange={(e) => setPropina(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Acciones */}
          {(esEditable || comanda.estado === 'LISTA') && (
            <div className="space-y-2">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button className="w-full" onClick={facturar} disabled={accionando}>
                <Receipt className="h-4 w-4 mr-1.5" />
                {accionando ? 'Procesando...' : 'Facturar y cerrar'}
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => actualizarEstado('CANCELADA')}
                disabled={accionando}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Cancelar comanda
              </Button>
            </div>
          )}

          {comanda.notas && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 mb-1">Notas</p>
              <p className="text-xs text-amber-600">{comanda.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
