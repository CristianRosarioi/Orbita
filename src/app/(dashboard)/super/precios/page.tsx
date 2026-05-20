'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Layers, Trash2, X } from 'lucide-react';

interface PrecioVolumen {
  id: string;
  productoId: string;
  cantidadMin: string;
  precio: string;
  etiqueta: string | null;
  activo: boolean;
  producto: { id: string; nombre: string; sku: string | null };
}

interface GrupoProducto {
  productoId: string;
  nombre: string;
  sku: string | null;
  precios: PrecioVolumen[];
}

function agrupar(lista: PrecioVolumen[]): GrupoProducto[] {
  const map = new Map<string, GrupoProducto>();
  for (const p of lista) {
    if (!map.has(p.productoId)) {
      map.set(p.productoId, {
        productoId: p.productoId,
        nombre: p.producto.nombre,
        sku: p.producto.sku,
        precios: [],
      });
    }
    map.get(p.productoId)!.precios.push(p);
  }
  return Array.from(map.values());
}

interface ProductoBusqueda {
  id: string;
  nombre: string;
  sku: string | null;
}

export default function PreciosVolumenPage() {
  const [lista, setLista] = useState<PrecioVolumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [busquedaGlobal, setBusquedaGlobal] = useState('');

  // Modal agregar precio
  const [modal, setModal] = useState(false);
  const [productoFijo, setProductoFijo] = useState<ProductoBusqueda | null>(null);
  const [busqProd, setBusqProd] = useState('');
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [cantidadMin, setCantidadMin] = useState('');
  const [precio, setPrecio] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/super/precios-volumen');
      const json = await res.json();
      if (json.success) setLista(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (busqProd.length < 2) return;
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/productos?q=${encodeURIComponent(busqProd)}&limit=6`);
        const json = await res.json();
        if (json.success) setResultados(json.data);
        else setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [busqProd]);

  const resultadosVisibles = busqProd.length >= 2 ? resultados : [];

  const abrirModal = (prod?: ProductoBusqueda) => {
    setProductoFijo(prod ?? null);
    setBusqProd('');
    setResultados([]);
    setCantidadMin('');
    setPrecio('');
    setEtiqueta('');
    setErrorModal('');
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setProductoFijo(null);
  };

  const guardar = async () => {
    if (!productoFijo) {
      setErrorModal('Selecciona un producto.');
      return;
    }
    if (!cantidadMin || !precio) {
      setErrorModal('Cantidad mínima y precio son obligatorios.');
      return;
    }
    setSaving(true);
    setErrorModal('');
    const res = await fetch('/api/super/precios-volumen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productoId: productoFijo.id,
        cantidadMin: Number(cantidadMin),
        precio: Number(precio),
        etiqueta: etiqueta || undefined,
      }),
    });
    const json = await res.json();
    if (json.success) {
      cerrarModal();
      cargar();
    } else {
      setErrorModal(json.error?.message ?? 'Error al guardar.');
    }
    setSaving(false);
  };

  const eliminar = async (id: string) => {
    await fetch(`/api/super/precios-volumen/${id}`, { method: 'DELETE' });
    cargar();
  };

  const grupos = agrupar(lista).filter(
    (g) =>
      !busquedaGlobal ||
      g.nombre.toLowerCase().includes(busquedaGlobal.toLowerCase()) ||
      g.sku?.toLowerCase().includes(busquedaGlobal.toLowerCase()),
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Precios por volumen</h1>
          <p className="text-sm text-slate-500">Precios escalonados según cantidad comprada</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Agregar precio
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-5 max-w-sm">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          value={busquedaGlobal}
          onChange={(e) => setBusquedaGlobal(e.target.value)}
          placeholder="Filtrar por producto..."
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Cargando precios...</div>
      ) : grupos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <Layers className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-500">No hay precios por volumen registrados.</p>
          <button
            onClick={() => abrirModal()}
            className="mt-3 text-sm text-indigo-600 hover:underline"
          >
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map((g) => (
            <div key={g.productoId} className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{g.nombre}</p>
                  {g.sku && <p className="text-xs text-slate-400">SKU: {g.sku}</p>}
                </div>
                <button
                  onClick={() => abrirModal({ id: g.productoId, nombre: g.nombre, sku: g.sku })}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Plus className="h-3 w-3" />
                  Agregar precio
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-4 py-2 text-xs font-semibold text-slate-500">
                        Cantidad mínima
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold text-slate-500">
                        Precio unitario
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold text-slate-500">Etiqueta</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {g.precios.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-slate-800">
                              ≥ {Number(p.cantidadMin).toLocaleString('es-DO')} uds.
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-emerald-700">
                          RD$
                          {Number(p.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {p.etiqueta ? (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                              {p.etiqueta}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => eliminar(p.id)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal agregar precio */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Agregar precio por volumen</h2>
              <button onClick={cerrarModal}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {errorModal && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorModal}
                </p>
              )}

              {/* Producto */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Producto *</label>
                {productoFijo ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-sm font-medium text-emerald-900">{productoFijo.nombre}</p>
                    {!productoFijo && (
                      <button
                        type="button"
                        onClick={() => setProductoFijo(null)}
                        className="text-xs text-emerald-700 hover:underline"
                      >
                        Cambiar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      value={busqProd}
                      onChange={(e) => setBusqProd(e.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {(buscando || resultadosVisibles.length > 0) && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                        {buscando ? (
                          <div className="px-4 py-3 text-sm text-slate-500">Buscando...</div>
                        ) : (
                          resultadosVisibles.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                setProductoFijo(r);
                                setBusqProd('');
                                setResultados([]);
                              }}
                              className="flex w-full items-center px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                            >
                              <div>
                                <p className="font-medium text-slate-900">{r.nombre}</p>
                                {r.sku && <p className="text-xs text-slate-400">SKU: {r.sku}</p>}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cantidad mínima y precio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Cantidad mínima *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={cantidadMin}
                    onChange={(e) => setCantidadMin(e.target.value)}
                    placeholder="Ej: 6"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Precio unitario *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                      RD$
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Etiqueta opcional */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Etiqueta <span className="text-slate-400">(opcional)</span>
                </label>
                <input
                  value={etiqueta}
                  onChange={(e) => setEtiqueta(e.target.value)}
                  placeholder="Ej: Precio mayorista, Pack familiar..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={cerrarModal}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar precio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
