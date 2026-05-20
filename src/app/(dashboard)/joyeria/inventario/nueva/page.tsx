'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevaPiezaPage() {
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
      const res = await fetch('/api/joyeria/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message ?? 'Error al guardar'); return; }
      router.push('/joyeria/inventario');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Nueva pieza</h1>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Código *</label>
            <input name="codigo" required placeholder="JY-0001" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo *</label>
            <input name="tipo" required placeholder="Anillo, Collar, Pulsera..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
          <input name="nombre" required placeholder="Anillo solitario 18K" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Material *</label>
          <select name="material" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none">
            <option value="">Selecciona</option>
            <option value="ORO_18K">Oro 18K</option>
            <option value="ORO_14K">Oro 14K</option>
            <option value="ORO_10K">Oro 10K</option>
            <option value="PLATA_925">Plata 925</option>
            <option value="PLATINO">Platino</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Peso (gramos)</label>
            <input name="pesoGramos" type="number" min="0" step="0.01" placeholder="3.5" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Quilates (diamantes)</label>
            <input name="quilates" type="number" min="0" step="0.01" placeholder="0.5" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Precio de compra (RD$)</label>
            <input name="precioCompra" type="number" min="0" step="0.01" placeholder="15000" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Precio de venta (RD$) *</label>
            <input name="precioVenta" type="number" min="0" step="0.01" required placeholder="25000" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
          <textarea name="descripcion" rows={2} placeholder="Características adicionales..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={guardando} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar pieza'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
