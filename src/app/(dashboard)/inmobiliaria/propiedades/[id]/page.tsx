'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Calendar, DollarSign } from 'lucide-react';

const ESTADO_CLASE: Record<string, string> = {
  ACTIVO: 'bg-emerald-100 text-emerald-800',
  VENCIDO: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-slate-100 text-slate-600',
  POR_VENCER: 'bg-yellow-100 text-yellow-800',
};

interface Contrato {
  id: string;
  inquilinoNombre: string;
  montoMensual: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

interface Propiedad {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  estado: string;
  direccion: string;
  sector: string | null;
  ciudad: string;
  habitaciones: number | null;
  banos: number | null;
  metrosCuadrados: number | null;
  precioAlquiler: number | null;
  precioVenta: number | null;
  descripcion: string | null;
  contratos: Contrato[];
}

export default function DetallePropiedadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`/api/inmobiliaria/propiedades/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPropiedad(d.data);
      })
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <div className="p-6 text-slate-400">Cargando...</div>;
  if (!propiedad) return <div className="p-6 text-red-500">Propiedad no encontrada</div>;

  const formatFecha = (s: string) => new Date(s).toLocaleDateString('es-DO');

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-slate-400">{propiedad.codigo}</p>
          <h1 className="text-2xl font-bold text-slate-900">{propiedad.nombre}</h1>
          <p className="text-sm text-slate-500">
            {propiedad.tipo} · {propiedad.sector ? `${propiedad.sector}, ` : ''}
            {propiedad.ciudad}
          </p>
        </div>
        <Link
          href={`/inmobiliaria/contratos/nuevo?propiedadId=${propiedad.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Crear contrato
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {propiedad.habitaciones != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{propiedad.habitaciones}</p>
            <p className="text-xs text-slate-500">Habitaciones</p>
          </div>
        )}
        {propiedad.banos != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{propiedad.banos}</p>
            <p className="text-xs text-slate-500">Baños</p>
          </div>
        )}
        {propiedad.metrosCuadrados != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{Number(propiedad.metrosCuadrados)}</p>
            <p className="text-xs text-slate-500">Metros²</p>
          </div>
        )}
        {propiedad.precioAlquiler != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <DollarSign className="h-4 w-4 text-indigo-600" />
              <p className="text-lg font-bold text-slate-900">
                {Number(propiedad.precioAlquiler).toLocaleString('es-DO')}
              </p>
            </div>
            <p className="text-xs text-slate-500">RD$/mes</p>
          </div>
        )}
      </div>

      {propiedad.descripcion && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{propiedad.descripcion}</p>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Historial de contratos</h2>
        {propiedad.contratos.length === 0 ? (
          <p className="text-sm text-slate-400">Sin contratos registrados</p>
        ) : (
          <div className="space-y-3">
            {propiedad.contratos.map((c) => (
              <Link
                key={c.id}
                href={`/inmobiliaria/contratos/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">{c.inquilinoNombre}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    {formatFecha(c.fechaInicio)} — {formatFecha(c.fechaFin)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    RD$ {Number(c.montoMensual).toLocaleString('es-DO')}/mes
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_CLASE[c.estado] ?? ''}`}
                  >
                    {c.estado}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Volver
        </button>
      </div>
    </div>
  );
}
