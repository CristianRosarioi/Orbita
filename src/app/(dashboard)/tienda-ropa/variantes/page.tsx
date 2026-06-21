'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Plus, Pencil, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Producto {
  id: string;
  nombre: string;
  codigo: string | null;
}

interface Variante {
  id: string;
  talla: string | null;
  color: string | null;
  sku: string | null;
  stock: number;
  precio: number | null;
  activa: boolean;
}

const TALLAS_COMUNES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'];

export default function VariantesPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState('');
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    talla: '',
    tallaPersonalizada: '',
    color: '',
    sku: '',
    stock: '0',
    precio: '',
  });

  const [editForm, setEditForm] = useState({
    stock: '',
    precio: '',
    activa: true,
  });

  useEffect(() => {
    fetch('/api/productos?limit=200')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProductos(d.data?.items ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!productoId) return;
    fetch(`/api/tienda-ropa/variantes?productoId=${productoId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVariantes(d.data ?? []);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [productoId]);

  function setF(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAgregarVariante(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const talla = form.talla === 'otra' ? form.tallaPersonalizada : form.talla || undefined;
    try {
      const res = await fetch('/api/tienda-ropa/variantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId,
          talla: talla || undefined,
          color: form.color || undefined,
          sku: form.sku || undefined,
          stock: parseInt(form.stock) || 0,
          precio: form.precio ? parseFloat(form.precio) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al crear variante.');
        return;
      }
      setVariantes((prev) => [...prev, data.data]);
      setForm({ talla: '', tallaPersonalizada: '', color: '', sku: '', stock: '0', precio: '' });
      setMostrarForm(false);
    } catch {
      setError('Error de conexión.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarEdicion(id: string) {
    setGuardando(true);
    try {
      const res = await fetch(`/api/tienda-ropa/variantes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: parseInt(editForm.stock) || 0,
          precio: editForm.precio ? parseFloat(editForm.precio) : null,
          activa: editForm.activa,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVariantes((prev) => prev.map((v) => (v.id === id ? data.data : v)));
        setEditandoId(null);
      }
    } catch {
    } finally {
      setGuardando(false);
    }
  }

  async function handleDesactivar(id: string) {
    if (!confirm('¿Desactivar esta variante?')) return;
    await fetch(`/api/tienda-ropa/variantes/${id}`, { method: 'DELETE' });
    setVariantes((prev) => prev.map((v) => (v.id === id ? { ...v, activa: false } : v)));
    router.refresh();
  }

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
          <Layers className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Variantes de productos</h1>
          <p className="text-sm text-slate-500">Administra tallas, colores y stock por variante</p>
        </div>
      </div>

      {/* Selector de producto */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <Label htmlFor="producto" className="mb-2 block text-sm font-semibold text-slate-700">
          Selecciona un producto
        </Label>
        <select
          id="producto"
          value={productoId}
          onChange={(e) => {
            const pid = e.target.value;
            setProductoId(pid);
            setVariantes([]);
            setCargando(!!pid);
            setMostrarForm(false);
            setEditandoId(null);
          }}
          className="h-9 w-full max-w-sm rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="">— Elige un producto —</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.codigo ? `(${p.codigo})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de variantes */}
      {productoId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">
              {cargando
                ? 'Cargando...'
                : `${variantes.length} variante${variantes.length !== 1 ? 's' : ''}`}
            </p>
            {!mostrarForm && (
              <Button size="sm" onClick={() => setMostrarForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Agregar variante
              </Button>
            )}
          </div>

          {/* Formulario inline */}
          {mostrarForm && (
            <form
              onSubmit={handleAgregarVariante}
              className="rounded-xl border border-pink-200 bg-pink-50 p-5 space-y-4"
            >
              <h3 className="text-sm font-semibold text-slate-700">Nueva variante</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="talla">Talla</Label>
                  <select
                    id="talla"
                    value={form.talla}
                    onChange={(e) => setF('talla', e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Sin talla</option>
                    {TALLAS_COMUNES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="otra">Otra</option>
                  </select>
                  {form.talla === 'otra' && (
                    <Input
                      placeholder="Ej: 40, 42..."
                      value={form.tallaPersonalizada}
                      onChange={(e) => setF('tallaPersonalizada', e.target.value)}
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="Ej: Rojo, Azul marino"
                    value={form.color}
                    onChange={(e) => setF('color', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="Código interno"
                    value={form.sku}
                    onChange={(e) => setF('sku', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stock">Stock inicial</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setF('stock', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="precio">Precio especial (RD$)</Label>
                  <Input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Precio del producto base"
                    value={form.precio}
                    onChange={(e) => setF('precio', e.target.value)}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Agregar'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setMostrarForm(false);
                    setError(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {variantes.length === 0 && !cargando ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <Layers className="mx-auto mb-3 h-7 w-7 text-slate-300" />
              <p className="text-sm text-slate-500">Sin variantes. Agrega la primera.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Talla
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Color
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {variantes.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{v.talla ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{v.color ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{v.sku ?? '—'}</td>
                      {editandoId === v.id ? (
                        <>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              className="w-20 text-right"
                              value={editForm.stock}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, stock: e.target.value }))
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-28 text-right"
                              value={editForm.precio}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, precio: e.target.value }))
                              }
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={editForm.activa}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, activa: e.target.checked }))
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleGuardarEdicion(v.id)}
                                disabled={guardando}
                                className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditandoId(null)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {v.stock}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {v.precio != null
                              ? `RD$ ${Number(v.precio).toLocaleString('es-DO')}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              className={
                                v.activa
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }
                            >
                              {v.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => {
                                  setEditandoId(v.id);
                                  setEditForm({
                                    stock: String(v.stock),
                                    precio: v.precio != null ? String(v.precio) : '',
                                    activa: v.activa,
                                  });
                                }}
                                className="rounded p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {v.activa && (
                                <button
                                  onClick={() => handleDesactivar(v.id)}
                                  className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
