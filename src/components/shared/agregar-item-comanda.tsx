'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Producto {
  id: string;
  nombre: string;
  precioVenta: number;
  sku?: string | null;
}

interface AgregarItemComandaProps {
  comandaId: string;
  onItemAgregado: () => void;
}

export function AgregarItemComanda({ comandaId, onItemAgregado }: AgregarItemComandaProps) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [seleccionado, setSeleccionado] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  async function buscarProductos(q: string) {
    if (q.length < 2) { setResultados([]); return; }
    setBuscando(true);
    try {
      const res = await fetch(`/api/productos?search=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      if (data.success) setResultados(data.data.items ?? []);
    } finally {
      setBuscando(false);
    }
  }

  async function agregarItem() {
    if (!seleccionado) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/restaurante/comandas/${comandaId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: seleccionado.id,
          nombre: seleccionado.nombre,
          cantidad,
          precio: seleccionado.precioVenta,
          notas: notas || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) { setError(data.error?.message ?? 'Error al agregar el ítem.'); return; }

      setSeleccionado(null);
      setBusqueda('');
      setResultados([]);
      setCantidad(1);
      setNotas('');
      onItemAgregado();
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
      <p className="text-sm font-semibold text-slate-700">Agregar ítem</p>

      {!seleccionado ? (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); buscarProductos(e.target.value); }}
              placeholder="Buscar producto por nombre o SKU..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {resultados.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-48 overflow-y-auto">
              {resultados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSeleccionado(p); setResultados([]); setBusqueda(''); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between"
                >
                  <span className="font-medium text-slate-800">{p.nombre}</span>
                  <span className="text-slate-500">RD$ {Number(p.precioVenta).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </button>
              ))}
            </div>
          )}

          {buscando && <p className="text-xs text-slate-400 mt-1">Buscando...</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-slate-800">{seleccionado.nombre}</p>
              <p className="text-xs text-slate-500">RD$ {Number(seleccionado.precioVenta).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
            </div>
            <button onClick={() => setSeleccionado(null)} className="text-slate-400 hover:text-slate-600 text-xs">
              Cambiar
            </button>
          </div>

          <div className="flex gap-3">
            <div className="w-24">
              <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad</label>
              <input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notas (sin cebolla, etc.)</label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Opcional"
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button onClick={agregarItem} disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-1.5" />
            {loading ? 'Agregando...' : 'Agregar a la comanda'}
          </Button>
        </div>
      )}
    </div>
  );
}
