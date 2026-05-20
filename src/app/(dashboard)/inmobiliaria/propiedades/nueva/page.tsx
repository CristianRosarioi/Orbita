'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevaPropiedadPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((v, k) => { if (v !== '') body[k] = v; });

    try {
      const res = await fetch('/api/inmobiliaria/propiedades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message ?? 'Error al guardar'); return; }
      router.push('/inmobiliaria/propiedades');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Nueva propiedad</h1>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Código *</label>
            <input name="codigo" required placeholder="REF-001" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo *</label>
            <select name="tipo" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none">
              <option value="">Selecciona</option>
              <option value="APARTAMENTO">Apartamento</option>
              <option value="CASA">Casa</option>
              <option value="LOCAL_COMERCIAL">Local comercial</option>
              <option value="OFICINA">Oficina</option>
              <option value="TERRENO">Terreno</option>
              <option value="NAVE_INDUSTRIAL">Nave industrial</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
          <input name="nombre" required placeholder="Apto 2B Torre Este" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Dirección *</label>
          <input name="direccion" required placeholder="Calle 30 de Marzo #45, Los Prados" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Sector</label>
            <input name="sector" placeholder="Evaristo Morales" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ciudad</label>
            <input name="ciudad" defaultValue="Santo Domingo" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Habitaciones</label>
            <input name="habitaciones" type="number" min="0" placeholder="3" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Baños</label>
            <input name="banos" type="number" min="0" placeholder="2" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Metros²</label>
            <input name="metrosCuadrados" type="number" min="0" step="0.01" placeholder="95" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Precio de alquiler (RD$)</label>
            <input name="precioAlquiler" type="number" min="0" step="0.01" placeholder="25000" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Precio de venta (RD$)</label>
            <input name="precioVenta" type="number" min="0" step="0.01" placeholder="4500000" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
          <textarea name="descripcion" rows={3} placeholder="Detalles adicionales..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={guardando} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar propiedad'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
