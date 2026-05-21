'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Propiedad {
  id: string;
  codigo: string;
  nombre: string;
  precioAlquiler: number | null;
}

export default function NuevoContratoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(
    searchParams.get('propiedadId') ?? '',
  );

  useEffect(() => {
    fetch('/api/inmobiliaria/propiedades?estado=DISPONIBLE&limit=100')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPropiedades(d.data);
      });
  }, []);

  const propActual = propiedades.find((p) => p.id === propiedadSeleccionada);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      if (v !== '') body[k] = v;
    });

    try {
      const res = await fetch('/api/inmobiliaria/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? 'Error al guardar');
        return;
      }
      router.push('/inmobiliaria/contratos');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Nuevo contrato de alquiler</h1>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Propiedad *</label>
          <select
            name="propiedadId"
            required
            value={propiedadSeleccionada}
            onChange={(e) => setPropiedadSeleccionada(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="">Selecciona una propiedad disponible</option>
            {propiedades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} — {p.nombre}
              </option>
            ))}
          </select>
          {propActual?.precioAlquiler && (
            <p className="mt-1 text-xs text-slate-500">
              Precio sugerido: RD$ {Number(propActual.precioAlquiler).toLocaleString('es-DO')}/mes
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="mb-4 font-medium text-slate-700">Datos del inquilino</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nombre completo *
              </label>
              <input
                name="inquilinoNombre"
                required
                placeholder="Juan Pérez"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
                <input
                  name="inquilinoTelefono"
                  type="tel"
                  placeholder="809-000-0000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Cédula</label>
                <input
                  name="inquilinoCedula"
                  placeholder="001-1234567-1"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="mb-4 font-medium text-slate-700">Condiciones del contrato</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Monto mensual (RD$) *
                </label>
                <input
                  name="montoMensual"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={propActual?.precioAlquiler ?? ''}
                  placeholder="25000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Depósito (RD$)
                </label>
                <input
                  name="deposito"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha de inicio *
                </label>
                <input
                  name="fechaInicio"
                  type="date"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha de fin *
                </label>
                <input
                  name="fechaFin"
                  type="date"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
              <textarea
                name="notas"
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Crear contrato'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
