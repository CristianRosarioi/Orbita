'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const SIGUIENTE_ESTADO: Record<string, { estado: string; label: string; variant: 'default' | 'outline' }> = {
  PENDIENTE: { estado: 'CONFIRMADA', label: 'Confirmar cita', variant: 'default' },
  CONFIRMADA: { estado: 'EN_PROCESO', label: 'Iniciar servicio', variant: 'default' },
  EN_PROCESO: { estado: 'COMPLETADA', label: 'Completar', variant: 'default' },
};

interface CitaAccionesProps {
  citaId: string;
  estado: string;
}

export default function CitaAcciones({ citaId, estado }: CitaAccionesProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cerrado = estado === 'COMPLETADA' || estado === 'CANCELADA' || estado === 'NO_SHOW';

  async function cambiarEstado(nuevoEstado: string) {
    setError(null);
    setLoading(nuevoEstado);
    try {
      const res = await fetch(`/api/salon/citas/${citaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al cambiar el estado.');
        return;
      }
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(null);
    }
  }

  async function facturar() {
    setError(null);
    setLoading('FACTURAR');
    try {
      const res = await fetch(`/api/salon/citas/${citaId}/facturar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metodoPago: 'EFECTIVO' }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al facturar.');
        return;
      }
      router.push(`/facturacion/${data.data.facturaId}`);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(null);
    }
  }

  if (cerrado) return null;

  const siguiente = SIGUIENTE_ESTADO[estado];

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {siguiente && (
          <Button
            onClick={() => cambiarEstado(siguiente.estado)}
            disabled={loading !== null}
            variant={siguiente.variant}
          >
            {loading === siguiente.estado ? 'Procesando...' : siguiente.label}
          </Button>
        )}

        {estado === 'COMPLETADA' && (
          <Button onClick={facturar} disabled={loading !== null}>
            {loading === 'FACTURAR' ? 'Generando factura...' : 'Facturar'}
          </Button>
        )}

        {estado !== 'CANCELADA' && estado !== 'NO_SHOW' && (
          <>
            <Button
              variant="outline"
              onClick={() => cambiarEstado('NO_SHOW')}
              disabled={loading !== null}
            >
              {loading === 'NO_SHOW' ? 'Procesando...' : 'No se presentó'}
            </Button>
            <Button
              variant="outline"
              onClick={() => cambiarEstado('CANCELADA')}
              disabled={loading !== null}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {loading === 'CANCELADA' ? 'Cancelando...' : 'Cancelar cita'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
