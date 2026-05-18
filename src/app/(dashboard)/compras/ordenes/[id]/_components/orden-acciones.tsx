'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Package, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ItemOrden {
  id: string;
  descripcion: string;
  cantidad: number;
  cantidadRecibida: number;
}

interface Props {
  ordenId: string;
  estado: string;
  items: ItemOrden[];
}

export function OrdenAcciones({ ordenId, estado, items }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showRecibirModal, setShowRecibirModal] = useState(false);
  const [cantidades, setCantidades] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.id, Number(i.cantidad) - Number(i.cantidadRecibida)])),
  );

  async function enviar() {
    setLoading('enviar');
    try {
      const res = await fetch(`/api/compras/ordenes/${ordenId}/enviar`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al enviar la orden');
        return;
      }
      toast.success('Orden enviada al proveedor');
      router.refresh();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(null);
    }
  }

  async function cancelar() {
    if (!confirm('¿Cancelar esta orden? Esta acción no se puede deshacer.')) return;
    setLoading('cancelar');
    try {
      const res = await fetch(`/api/compras/ordenes/${ordenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'CANCELADA' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al cancelar');
        return;
      }
      toast.success('Orden cancelada');
      router.refresh();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(null);
    }
  }

  async function recibirOrden() {
    setLoading('recibir');
    try {
      const itemsRecibidos = items.map((i) => ({
        itemId: i.id,
        cantidadRecibida: cantidades[i.id] ?? 0,
      }));
      const res = await fetch(`/api/compras/ordenes/${ordenId}/recibir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsRecibidos }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al registrar recepción');
        return;
      }
      toast.success('Recepción registrada');
      setShowRecibirModal(false);
      router.refresh();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {estado === 'BORRADOR' && (
          <Button onClick={enviar} disabled={loading !== null} size="sm">
            {loading === 'enviar' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar al proveedor
          </Button>
        )}

        {(estado === 'ENVIADA' || estado === 'RECIBIDA_PARCIAL') && (
          <Button
            onClick={() => setShowRecibirModal(true)}
            disabled={loading !== null}
            size="sm"
          >
            <Package className="h-4 w-4 mr-2" />
            Registrar recepción
          </Button>
        )}

        {(estado === 'BORRADOR' || estado === 'ENVIADA') && (
          <Button
            variant="outline"
            onClick={cancelar}
            disabled={loading !== null}
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {loading === 'cancelar' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Cancelar orden
          </Button>
        )}
      </div>

      {/* Modal de recepción */}
      {showRecibirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Registrar recepción</h3>
              <button
                onClick={() => setShowRecibirModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-500">
                Ingresa las cantidades efectivamente recibidas de cada ítem.
              </p>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {item.descripcion}
                      </p>
                      <p className="text-xs text-slate-500">
                        Pendiente:{' '}
                        {Number(item.cantidad) - Number(item.cantidadRecibida)} /{' '}
                        {Number(item.cantidad)}
                      </p>
                    </div>
                    <div className="shrink-0 w-24">
                      <Input
                        type="number"
                        min="0"
                        max={Number(item.cantidad) - Number(item.cantidadRecibida)}
                        step="0.01"
                        value={cantidades[item.id] ?? 0}
                        onChange={(e) =>
                          setCantidades((prev) => ({
                            ...prev,
                            [item.id]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="h-8 text-sm text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecibirModal(false)}
                disabled={loading !== null}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={recibirOrden} disabled={loading !== null}>
                {loading === 'recibir' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar recepción
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
