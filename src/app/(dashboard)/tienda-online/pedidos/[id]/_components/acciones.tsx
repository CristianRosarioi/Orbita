'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const SIGUIENTE_ESTADO: Record<string, string> = {
  PENDIENTE: 'CONFIRMADO',
  CONFIRMADO: 'PREPARANDO',
  PREPARANDO: 'ENVIADO',
  ENVIADO: 'ENTREGADO',
};

const BOTON_LABEL: Record<string, string> = {
  PENDIENTE: 'Confirmar pedido',
  CONFIRMADO: 'Marcar preparando',
  PREPARANDO: 'Marcar enviado',
  ENVIADO: 'Marcar entregado',
};

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'CREDITO', label: 'Crédito' },
];

interface Props {
  pedidoId: string;
  estadoActual: string;
  facturaId?: string | null;
}

export function PedidoOnlineAcciones({ pedidoId, estadoActual }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFacturar, setMostrarFacturar] = useState(false);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [cancelando, setCancelando] = useState(false);

  const puedeAvanzar = estadoActual in SIGUIENTE_ESTADO;
  const esEnviado = estadoActual === 'ENVIADO';

  async function avanzarEstado() {
    if (esEnviado) {
      setMostrarFacturar(true);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/tienda-online/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: SIGUIENTE_ESTADO[estadoActual] }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al actualizar.');
        return;
      }
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  async function facturar() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/tienda-online/pedidos/${pedidoId}/facturar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metodoPago }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al facturar.');
        return;
      }
      router.push(`/facturas/${data.data.id}`);
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  async function cancelar() {
    if (!confirm('¿Cancelar este pedido?')) return;
    setCancelando(true);
    try {
      const res = await fetch(`/api/tienda-online/pedidos/${pedidoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al cancelar.');
        return;
      }
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setCancelando(false);
    }
  }

  if (mostrarFacturar) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Facturar y entregar</h2>
        <div className="space-y-1.5">
          <label className="text-sm text-slate-600">Método de pago</label>
          <div className="flex flex-wrap gap-2">
            {METODOS_PAGO.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMetodoPago(m.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  metodoPago === m.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={facturar} disabled={loading}>
            {loading ? 'Procesando...' : 'Confirmar y facturar'}
          </Button>
          <Button variant="outline" onClick={() => setMostrarFacturar(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {puedeAvanzar && (
          <Button onClick={avanzarEstado} disabled={loading}>
            {loading ? 'Procesando...' : BOTON_LABEL[estadoActual]}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={cancelar}
          disabled={cancelando}
          className="text-red-600 hover:text-red-700 hover:border-red-300"
        >
          {cancelando ? 'Cancelando...' : 'Cancelar pedido'}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
