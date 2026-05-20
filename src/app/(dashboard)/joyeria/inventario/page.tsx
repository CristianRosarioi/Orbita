'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Gem, Plus } from 'lucide-react';

const MATERIAL_LABEL: Record<string, string> = {
  ORO_18K: 'Oro 18K',
  ORO_14K: 'Oro 14K',
  ORO_10K: 'Oro 10K',
  PLATA_925: 'Plata 925',
  PLATINO: 'Platino',
  OTRO: 'Otro',
};

const ESTADO_CONFIG: Record<string, { label: string; clase: string }> = {
  EN_VITRINA: { label: 'En vitrina', clase: 'bg-emerald-100 text-emerald-800' },
  VENDIDA: { label: 'Vendida', clase: 'bg-slate-100 text-slate-600' },
  EN_REPARACION: { label: 'En reparación', clase: 'bg-blue-100 text-blue-800' },
  RESERVADA: { label: 'Reservada', clase: 'bg-purple-100 text-purple-800' },
  CONSIGNACION: { label: 'Consignación', clase: 'bg-orange-100 text-orange-800' },
};

interface Pieza {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  material: string;
  pesoGramos: number | null;
  quilates: number | null;
  estado: string;
  precioVenta: number;
}

export default function InventarioJoyeriaPage() {
  const [piezas, setPiezas] = useState<Pieza[]>([]);
  const [cargando, setCargando] = useState(true);
  const [materialFiltro, setMaterialFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(() => {
    const params = new URLSearchParams({ limit: '48' });
    if (materialFiltro) params.set('material', materialFiltro);
    if (estadoFiltro) params.set('estado', estadoFiltro);
    if (busqueda) params.set('q', busqueda);
    fetch(`/api/joyeria/inventario?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setPiezas(d.data); })
      .finally(() => setCargando(false));
  }, [materialFiltro, estadoFiltro, busqueda]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario de joyas</h1>
          <p className="text-sm text-slate-500">{piezas.length} piezas</p>
        </div>
        <Link
          href="/joyeria/inventario/nueva"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva pieza
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por código o nombre..."
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-56"
        />
        <select
          value={materialFiltro}
          onChange={(e) => setMaterialFiltro(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos los materiales</option>
          {Object.entries(MATERIAL_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : piezas.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Gem className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-400">No hay piezas registradas</p>
          <Link href="/joyeria/inventario/nueva" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
            Agregar primera pieza
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {piezas.map((p) => {
            const estadoCfg = ESTADO_CONFIG[p.estado] ?? ESTADO_CONFIG.EN_VITRINA;
            return (
              <Link
                key={p.id}
                href={`/joyeria/inventario/${p.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 mx-auto">
                  <Gem className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-center text-xs font-mono text-slate-400">{p.codigo}</p>
                <p className="mt-0.5 text-center text-sm font-semibold text-slate-900 leading-tight">{p.nombre}</p>
                <p className="mt-1 text-center text-xs text-slate-500">{p.tipo} · {MATERIAL_LABEL[p.material]}</p>
                <div className="mt-2 flex justify-center gap-1 text-xs text-slate-400">
                  {p.pesoGramos != null && <span>{Number(p.pesoGramos)}g</span>}
                  {p.quilates != null && <span>· {Number(p.quilates)}ct</span>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoCfg.clase}`}>
                    {estadoCfg.label}
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    RD$ {Number(p.precioVenta).toLocaleString('es-DO')}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
