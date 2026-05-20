'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building,
  Plus,
  Home,
  Store,
  Trees,
  Factory,
  BriefcaseBusiness,
  CheckCircle,
  XCircle,
  Wrench,
  Tag,
} from 'lucide-react';

const TIPO_LABEL: Record<string, string> = {
  APARTAMENTO: 'Apartamento',
  CASA: 'Casa',
  LOCAL_COMERCIAL: 'Local comercial',
  OFICINA: 'Oficina',
  TERRENO: 'Terreno',
  NAVE_INDUSTRIAL: 'Nave industrial',
};

const TIPO_ICON: Record<string, React.ElementType> = {
  APARTAMENTO: Building,
  CASA: Home,
  LOCAL_COMERCIAL: Store,
  TERRENO: Trees,
  NAVE_INDUSTRIAL: Factory,
  OFICINA: BriefcaseBusiness,
};

const ESTADO_CONFIG: Record<string, { label: string; clase: string; icono: React.ElementType }> = {
  DISPONIBLE: { label: 'Disponible', clase: 'bg-emerald-100 text-emerald-800', icono: CheckCircle },
  ALQUILADA: { label: 'Alquilada', clase: 'bg-blue-100 text-blue-800', icono: XCircle },
  EN_VENTA: { label: 'En venta', clase: 'bg-orange-100 text-orange-800', icono: Tag },
  VENDIDA: { label: 'Vendida', clase: 'bg-slate-100 text-slate-600', icono: CheckCircle },
  MANTENIMIENTO: { label: 'Mantenimiento', clase: 'bg-yellow-100 text-yellow-800', icono: Wrench },
};

interface Propiedad {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  estado: string;
  ciudad: string;
  sector: string | null;
  habitaciones: number | null;
  banos: number | null;
  metrosCuadrados: number | null;
  precioAlquiler: number | null;
  precioVenta: number | null;
  _count: { contratos: number };
}

export default function PropiedadesPage() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const cargar = useCallback(() => {
    const params = new URLSearchParams();
    if (tipoFiltro) params.set('tipo', tipoFiltro);
    if (estadoFiltro) params.set('estado', estadoFiltro);
    fetch(`/api/inmobiliaria/propiedades?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPropiedades(d.data);
      })
      .finally(() => setCargando(false));
  }, [tipoFiltro, estadoFiltro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Propiedades</h1>
          <p className="text-sm text-slate-500">{propiedades.length} propiedades registradas</p>
        </div>
        <Link
          href="/inmobiliaria/propiedades/nueva"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva propiedad
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : propiedades.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Building className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-500">No hay propiedades registradas</p>
          <Link href="/inmobiliaria/propiedades/nueva" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
            Agregar primera propiedad
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {propiedades.map((p) => {
            const TipoIcon = TIPO_ICON[p.tipo] ?? Building;
            const estadoCfg = ESTADO_CONFIG[p.estado] ?? ESTADO_CONFIG.DISPONIBLE;
            const EstadoIcon = estadoCfg.icono;
            return (
              <Link
                key={p.id}
                href={`/inmobiliaria/propiedades/${p.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <TipoIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoCfg.clase}`}>
                    <EstadoIcon className="h-3 w-3" />
                    {estadoCfg.label}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400">{p.codigo}</p>
                <p className="mt-0.5 font-semibold text-slate-900 leading-tight">{p.nombre}</p>
                <p className="mt-1 text-xs text-slate-500">{TIPO_LABEL[p.tipo]}</p>
                <p className="text-xs text-slate-400">{p.sector ? `${p.sector}, ` : ''}{p.ciudad}</p>

                <div className="mt-3 flex gap-3 text-xs text-slate-500">
                  {p.habitaciones != null && <span>{p.habitaciones} hab.</span>}
                  {p.banos != null && <span>{p.banos} baños</span>}
                  {p.metrosCuadrados != null && <span>{Number(p.metrosCuadrados)} m²</span>}
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  {p.precioAlquiler != null && (
                    <p className="text-sm font-semibold text-indigo-700">
                      RD$ {Number(p.precioAlquiler).toLocaleString('es-DO')}/mes
                    </p>
                  )}
                  {p.precioVenta != null && (
                    <p className="text-xs text-slate-500">
                      Venta: RD$ {Number(p.precioVenta).toLocaleString('es-DO')}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
