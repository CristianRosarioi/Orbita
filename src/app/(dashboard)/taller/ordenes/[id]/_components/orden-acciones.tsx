'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Truck, Receipt } from 'lucide-react';

const SIGUIENTE_ESTADO: Record<string, string> = {
  RECIBIDO: 'EN_DIAGNOSTICO',
  EN_DIAGNOSTICO: 'EN_REPARACION',
  ESPERANDO_REPUESTOS: 'EN_REPARACION',
  EN_REPARACION: 'LISTO',
};

const LABEL_SIGUIENTE: Record<string, string> = {
  RECIBIDO: 'Iniciar diagnóstico',
  EN_DIAGNOSTICO: 'Iniciar reparación',
  ESPERANDO_REPUESTOS: 'Iniciar reparación',
  EN_REPARACION: 'Marcar como listo',
};

interface OrdenInfo {
  id: string;
  estado: string;
  facturaId: string | null;
}

export default function OrdenAcciones({ orden }: { orden: OrdenInfo }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFacturar, setShowFacturar] = useState(false);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');

  async function avanzarEstado() {
    const siguiente = SIGUIENTE_ESTADO[orden.estado];
    if (!siguiente) return;
    setError(null);
    setLoading('avanzar');
    try {
      const res = await fetch(`/api/taller/ordenes/${orden.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: siguiente }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error.');
        return;
      }
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(null);
    }
  }

  async function facturar() {
    setError(null);
    setLoading('facturar');
    try {
      const res = await fetch(`/api/taller/ordenes/${orden.id}/facturar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metodoPago }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error.');
        return;
      }
      setShowFacturar(false);
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(null);
    }
  }

  const cerrado = orden.estado === 'ENTREGADO' || orden.estado === 'CANCELADO';

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {SIGUIENTE_ESTADO[orden.estado] && (
          <Button size="sm" onClick={avanzarEstado} disabled={loading !== null}>
            <CheckCircle className="h-4 w-4 mr-1.5" />
            {loading === 'avanzar' ? 'Actualizando...' : LABEL_SIGUIENTE[orden.estado]}
          </Button>
        )}

        {orden.estado === 'EN_DIAGNOSTICO' && (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              setLoading('esperar');
              await fetch(`/api/taller/ordenes/${orden.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'ESPERANDO_REPUESTOS' }),
              });
              setLoading(null);
              router.refresh();
            }}
            disabled={loading !== null}
          >
            <Truck className="h-4 w-4 mr-1.5" />
            Esperar repuestos
          </Button>
        )}

        {orden.estado === 'LISTO' && !orden.facturaId && (
          <Button
            size="sm"
            onClick={() => setShowFacturar(true)}
            disabled={loading !== null}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Receipt className="h-4 w-4 mr-1.5" />
            Facturar y entregar
          </Button>
        )}
      </div>

      {/* Modal facturar */}
      {showFacturar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80 space-y-4">
            <h3 className="font-semibold text-slate-900">Facturar orden</h3>
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">Método de pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="CREDITO">Crédito</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={facturar}
                disabled={loading === 'facturar'}
                className="flex-1"
              >
                {loading === 'facturar' ? 'Procesando...' : 'Confirmar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFacturar(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>
      )}

      {!cerrado && !showFacturar && error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
