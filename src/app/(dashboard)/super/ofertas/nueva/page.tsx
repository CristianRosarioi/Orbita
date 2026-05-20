'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Tag } from 'lucide-react';

interface ProductoBusqueda {
  id: string;
  nombre: string;
  sku: string | null;
  precio: string;
}

export default function NuevaOfertaPage() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState<ProductoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoBusqueda | null>(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioOriginal, setPrecioOriginal] = useState('');
  const [precioOferta, setPrecioOferta] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const descuento =
    precioOriginal && precioOferta && Number(precioOferta) < Number(precioOriginal)
      ? Math.round(
          ((Number(precioOriginal) - Number(precioOferta)) / Number(precioOriginal)) * 10000,
        ) / 100
      : null;

  useEffect(() => {
    if (busqueda.length < 2) return;
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/productos?q=${encodeURIComponent(busqueda)}&limit=8`);
        const json = await res.json();
        if (json.success) setProductos(json.data);
        else setProductos([]);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const productosVisibles = busqueda.length >= 2 ? productos : [];

  const seleccionar = (p: ProductoBusqueda) => {
    setProductoSeleccionado(p);
    setPrecioOriginal(p.precio);
    setBusqueda('');
    setProductos([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado) {
      setError('Debes seleccionar un producto.');
      return;
    }
    if (!fechaInicio || !fechaFin) {
      setError('Debes indicar las fechas de vigencia.');
      return;
    }
    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }
    if (Number(precioOferta) >= Number(precioOriginal)) {
      setError('El precio de oferta debe ser menor al precio original.');
      return;
    }

    setSaving(true);
    setError('');

    const res = await fetch('/api/super/ofertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productoId: productoSeleccionado.id,
        nombre,
        descripcion: descripcion || undefined,
        precioOriginal: Number(precioOriginal),
        precioOferta: Number(precioOferta),
        fechaInicio: new Date(fechaInicio).toISOString(),
        fechaFin: new Date(fechaFin).toISOString(),
      }),
    });

    const json = await res.json();
    if (json.success) {
      router.push('/super/ofertas');
    } else {
      setError(json.error?.message ?? 'Error al crear la oferta.');
      setSaving(false);
    }
  };

  const hoy = new Date().toISOString().slice(0, 16);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/super/ofertas"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva oferta</h1>
          <p className="text-sm text-slate-500">
            Define un precio especial con vigencia automática
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-xl">
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Búsqueda de producto */}
          <div className="mb-5">
            <label className="mb-1 block text-sm font-medium text-slate-700">Producto *</label>
            {productoSeleccionado ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-emerald-900">
                    {productoSeleccionado.nombre}
                  </p>
                  {productoSeleccionado.sku && (
                    <p className="text-xs text-emerald-600">SKU: {productoSeleccionado.sku}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProductoSeleccionado(null);
                    setPrecioOriginal('');
                  }}
                  className="text-xs text-emerald-700 hover:underline"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o SKU..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {(buscando || productosVisibles.length > 0) && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                    {buscando ? (
                      <div className="px-4 py-3 text-sm text-slate-500">Buscando...</div>
                    ) : (
                      productosVisibles.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => seleccionar(p)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{p.nombre}</p>
                            {p.sku && <p className="text-xs text-slate-400">SKU: {p.sku}</p>}
                          </div>
                          <p className="text-xs font-semibold text-slate-700">
                            RD${Number(p.precio).toLocaleString('es-DO')}
                          </p>
                        </button>
                      ))
                    )}
                    {!buscando && productosVisibles.length === 0 && (
                      <div className="px-4 py-3 text-sm text-slate-500">Sin resultados.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nombre de la oferta */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nombre de la oferta *
            </label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Oferta de verano, 2x1 yogur..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Descripción */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Detalles adicionales de la oferta..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Precios */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Precio original *
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                  RD$
                </span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={precioOriginal}
                  onChange={(e) => setPrecioOriginal(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Precio de oferta *
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                  RD$
                </span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={precioOferta}
                  onChange={(e) => setPrecioOferta(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Descuento en tiempo real */}
          {descuento !== null && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">
              <Tag className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">Descuento: {descuento}%</span>
              <span className="text-sm text-orange-600">
                — ahorro de RD$
                {(Number(precioOriginal) - Number(precioOferta)).toLocaleString('es-DO', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {/* Fechas */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fecha inicio *
              </label>
              <input
                required
                type="datetime-local"
                min={hoy}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha fin *</label>
              <input
                required
                type="datetime-local"
                min={fechaInicio || hoy}
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/super/ofertas"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || !productoSeleccionado}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Crear oferta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
