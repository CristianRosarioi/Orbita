'use client';

import { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, Plus, ChevronDown, ChevronRight, Tag, X } from 'lucide-react';

interface CategoriaSuper {
  id: string;
  nombre: string;
  activo: boolean;
}

interface Departamento {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  categorias: CategoriaSuper[];
}

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalCategoria, setModalCategoria] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [nombreCat, setNombreCat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/super/departamentos');
      const json = await res.json();
      if (json.success) setDepartamentos(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crearDepartamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/super/departamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion: descripcion || undefined }),
    });
    const json = await res.json();
    if (json.success) {
      setModalNuevo(false);
      setNombre('');
      setDescripcion('');
      cargar();
    } else {
      setError(json.error?.message ?? 'Error al crear el departamento.');
    }
    setSaving(false);
  };

  const agregarCategoria = async (deptoId: string) => {
    if (!nombreCat.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/super/departamentos/${deptoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria: nombreCat }),
    });
    const json = await res.json();
    if (json.success) {
      setModalCategoria(null);
      setNombreCat('');
      cargar();
    }
    setSaving(false);
  };

  const desactivar = async (id: string) => {
    if (!confirm('¿Desactivar este departamento?')) return;
    await fetch(`/api/super/departamentos/${id}`, { method: 'DELETE' });
    cargar();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departamentos</h1>
          <p className="text-sm text-slate-500">Organización del supermercado por secciones</p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo departamento
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Cargando departamentos...</div>
      ) : departamentos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <LayoutGrid className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-500">No hay departamentos registrados.</p>
          <button
            onClick={() => setModalNuevo(true)}
            className="mt-3 text-sm text-indigo-600 hover:underline"
          >
            Crear primer departamento
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {departamentos.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-200 bg-white">
              <div
                className="flex cursor-pointer items-center gap-3 p-4"
                onClick={() => setExpandido(expandido === d.id ? null : d.id)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                  <LayoutGrid className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{d.nombre}</p>
                    {!d.activo && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {d.descripcion && (
                    <p className="truncate text-sm text-slate-500">{d.descripcion}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    {d.categorias.length} {d.categorias.length === 1 ? 'categoría' : 'categorías'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalCategoria(d.id);
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    + Categoría
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      desactivar(d.id);
                    }}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Desactivar
                  </button>
                  {expandido === d.id ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {expandido === d.id && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                  {d.categorias.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">
                      No hay categorías aún. Agrega la primera.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {d.categorias.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                        >
                          <Tag className="h-3 w-3" />
                          {c.nombre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo departamento */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Nuevo departamento</h2>
              <button onClick={() => setModalNuevo(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={crearDepartamento} className="space-y-4">
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
                <input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Lácteos, Carnes, Panadería..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
                <input
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Crear departamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nueva categoría */}
      {modalCategoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Nueva categoría</h2>
              <button onClick={() => setModalCategoria(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
                <input
                  value={nombreCat}
                  onChange={(e) => setNombreCat(e.target.value)}
                  placeholder="Ej: Yogures, Quesos..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onKeyDown={(e) => e.key === 'Enter' && agregarCategoria(modalCategoria)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModalCategoria(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => agregarCategoria(modalCategoria)}
                  disabled={saving || !nombreCat.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
