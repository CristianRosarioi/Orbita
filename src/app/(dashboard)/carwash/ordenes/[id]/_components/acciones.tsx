'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const SIGUIENTE_ESTADO: Record<string, string> = {
  EN_COLA: 'EN_PROCESO',
  EN_PROCESO: 'LISTO',
  LISTO: 'LISTO',
};

const BOTON_LABEL: Record<string, string> = {
  EN_COLA: 'Iniciar servicio',
  EN_PROCESO: 'Marcar como listo',
  LISTO: 'Facturar y entregar',
};

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

interface Props {
  ordenId: string;
  estadoActual: string;
  facturaId?: string | null;
}

export function OrdenCarwashAcciones({ ordenId, estadoActual }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFacturar, setMostrarFacturar] = useState(false);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');

  async function avanzarEstado() {
    if (estadoActual === 'LISTO') {
      setMostrarFacturar(true);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/carwash/ordenes/${ordenId}`, {
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
      const res = await fetch(`/api/carwash/ordenes/${ordenId}/facturar`, {
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
          <Button onClick={facturar} disabled={loading} className="gap-2">
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
    <div className="flex items-center gap-3">
      <Button onClick={avanzarEstado} disabled={loading} className="gap-2">
        {loading ? 'Procesando...' : BOTON_LABEL[estadoActual]}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
