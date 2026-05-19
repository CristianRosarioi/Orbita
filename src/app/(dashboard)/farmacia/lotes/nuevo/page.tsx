'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NuevoLotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    productoId: '',
    productoNombre: '',
    numeroLote: '',
    fechaVencimiento: '',
    cantidadInicial: '',
    precioCompra: '',
    proveedor: '',
    notas: '',
  });

  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<
    { id: string; nombre: string; sku: string | null }[]
  >([]);

  function set(f: string, v: string) {
    setForm((p) => ({ ...p, [f]: v }));
  }

  async function buscarProducto(q: string) {
    if (q.length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch(`/api/productos?q=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      if (data.success) setResultados(data.data ?? []);
    } finally {
      setBuscando(false);
    }
  }

  function seleccionarProducto(p: { id: string; nombre: string; sku: string | null }) {
    setForm((prev) => ({ ...prev, productoId: p.id, productoNombre: p.nombre }));
    setResultados([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.productoId) {
      setError('Selecciona un producto.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/farmacia/lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: form.productoId,
          numeroLote: form.numeroLote,
          fechaVencimiento: form.fechaVencimiento,
          cantidadInicial: parseFloat(form.cantidadInicial),
          precioCompra: form.precioCompra ? parseFloat(form.precioCompra) : undefined,
          proveedor: form.proveedor || undefined,
          notas: form.notas || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al crear el lote.');
        return;
      }
      router.push('/farmacia/lotes');
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nuevo lote</h1>
        <p className="text-slate-500 text-sm mt-1">
          Registra un lote de producto con fecha de vencimiento.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white rounded-lg border border-slate-200 p-6"
      >
        {/* Producto */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Producto</h2>
          <div className="space-y-1.5 relative">
            <Label htmlFor="buscarProducto">Buscar por nombre o SKU *</Label>
            <Input
              id="buscarProducto"
              value={form.productoId ? form.productoNombre : undefined}
              placeholder="Ej: Paracetamol, Amoxicilina..."
              onChange={(e) => {
                setForm((p) => ({ ...p, productoId: '', productoNombre: e.target.value }));
                buscarProducto(e.target.value);
              }}
            />
            {buscando && <p className="text-xs text-slate-400 mt-1">Buscando...</p>}
            {resultados.length > 0 && (
              <div className="absolute z-10 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                {resultados.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between"
                    onClick={() => seleccionarProducto(p)}
                  >
                    <span>{p.nombre}</span>
                    {p.sku && <span className="text-xs text-slate-400">{p.sku}</span>}
                  </button>
                ))}
              </div>
            )}
            {form.productoId && (
              <p className="text-xs text-emerald-600 mt-1">✓ Producto seleccionado</p>
            )}
          </div>
        </div>

        {/* Lote */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Información del lote
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="numeroLote">Número de lote *</Label>
              <Input
                id="numeroLote"
                value={form.numeroLote}
                onChange={(e) => set('numeroLote', e.target.value)}
                placeholder="Ej: L2024-001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaVencimiento">Fecha de vencimiento *</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={form.fechaVencimiento}
                onChange={(e) => set('fechaVencimiento', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cantidadInicial">Cantidad inicial *</Label>
              <Input
                id="cantidadInicial"
                type="number"
                min="0.01"
                step="0.01"
                value={form.cantidadInicial}
                onChange={(e) => set('cantidadInicial', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precioCompra">Precio de compra (RD$)</Label>
              <Input
                id="precioCompra"
                type="number"
                min="0.01"
                step="0.01"
                value={form.precioCompra}
                onChange={(e) => set('precioCompra', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proveedor">Proveedor</Label>
            <Input
              id="proveedor"
              value={form.proveedor}
              onChange={(e) => set('proveedor', e.target.value)}
              placeholder="Nombre del proveedor (opcional)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas</Label>
            <textarea
              id="notas"
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar lote'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
