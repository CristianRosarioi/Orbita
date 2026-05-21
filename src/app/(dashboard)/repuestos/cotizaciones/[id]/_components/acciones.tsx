'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

interface Props {
  cotizacionId: string;
  estadoActual: string;
  facturaId: string | null;
}

export function CotizacionAcciones({ cotizacionId, estadoActual, facturaId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFacturar, setMostrarFacturar] = useState(false);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');

  async function cambiarEstado(estado: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/repuestos/cotizaciones/${cotizacionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
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
      const res = await fetch(`/api/repuestos/cotizaciones/${cotizacionId}/facturar`, {
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
        <h2 className="text-sm font-semibold text-slate-700">Convertir en factura</h2>
        <div className="space-y-1.5">
          <p className="text-sm text-slate-600">Método de pago</p>
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
      <h2 className="mb-4 text-sm font-semibold text-slate-700">Acciones</h2>
      <div className="flex flex-wrap gap-3">
        {estadoActual === 'PENDIENTE' && (
          <>
            <Button onClick={() => cambiarEstado('APROBADA')} disabled={loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              Aprobar
            </Button>
            <Button variant="outline" onClick={() => cambiarEstado('RECHAZADA')} disabled={loading} className="text-red-600 border-red-200 hover:bg-red-50">
              Rechazar
            </Button>
          </>
        )}
        {estadoActual === 'APROBADA' && !facturaId && (
          <Button onClick={() => setMostrarFacturar(true)} disabled={loading} className="gap-2">
            Facturar cotización
          </Button>
        )}
        {estadoActual === 'RECHAZADA' && (
          <Button variant="outline" onClick={() => cambiarEstado('PENDIENTE')} disabled={loading}>
            Reactivar
          </Button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
