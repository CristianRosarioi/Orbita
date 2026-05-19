'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const SIGUIENTE_ESTADO: Record<string, { estado: string; label: string }> = {
  BORRADOR: { estado: 'ENVIADO', label: 'Enviar pedido' },
  ENVIADO: { estado: 'CONFIRMADO', label: 'Marcar confirmado' },
  CONFIRMADO: { estado: 'RECIBIDO', label: 'Marcar como recibido' },
};

interface PedidoAccionesProps {
  pedidoId: string;
  estado: string;
  items: { productoId: string | null; descripcion: string; cantidad: number; precioUnitario: number }[];
}

export default function PedidoAcciones({ pedidoId, estado, items }: PedidoAccionesProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoStock, setActualizandoStock] = useState(false);

  const cerrado = estado === 'CANCELADO' || estado === 'RECIBIDO';

  async function cambiarEstado(nuevoEstado: string) {
    setError(null);
    setLoading(nuevoEstado);
    try {
      const res = await fetch(`/api/ferreteria/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message ?? 'Error.'); return; }

      if (nuevoEstado === 'RECIBIDO') {
        setActualizandoStock(true);
      } else {
        router.refresh();
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(null);
    }
  }

  async function cancelar() {
    setError(null);
    setLoading('CANCELADO');
    try {
      const res = await fetch(`/api/ferreteria/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'CANCELADO' }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message ?? 'Error.'); return; }
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(null);
    }
  }

  async function actualizarInventario() {
    setError(null);
    setLoading('INVENTARIO');
    try {
      for (const item of items) {
        if (!item.productoId) continue;
        await fetch(`/api/inventario/ajuste`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productoId: item.productoId,
            tipo: 'ENTRADA',
            cantidad: item.cantidad,
            motivo: `Recepción pedido #${pedidoId}`,
          }),
        });
      }
      router.refresh();
    } catch {
      setError('Error al actualizar inventario.');
    } finally {
      setLoading(null);
      setActualizandoStock(false);
    }
  }

  if (cerrado && !actualizandoStock) return null;

  const siguiente = SIGUIENTE_ESTADO[estado];

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {actualizandoStock ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <p className="text-sm font-medium text-emerald-800">
            ¿Deseas actualizar el inventario con los productos recibidos?
          </p>
          <p className="text-xs text-emerald-700">
            Solo se actualizarán los ítems que tienen producto vinculado ({items.filter(i => i.productoId).length} de {items.length}).
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={actualizarInventario} disabled={loading !== null}>
              {loading === 'INVENTARIO' ? 'Actualizando...' : 'Sí, actualizar stock'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setActualizandoStock(false); router.refresh(); }}>
              No, omitir
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {siguiente && (
            <Button
              onClick={() => cambiarEstado(siguiente.estado)}
              disabled={loading !== null}
            >
              {loading === siguiente.estado ? 'Procesando...' : siguiente.label}
            </Button>
          )}
          {estado !== 'CANCELADO' && estado !== 'RECIBIDO' && (
            <Button
              variant="outline"
              onClick={cancelar}
              disabled={loading !== null}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {loading === 'CANCELADO' ? 'Cancelando...' : 'Cancelar pedido'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
