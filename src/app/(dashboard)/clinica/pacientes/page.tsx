'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UserRound, Plus, Search, FileText } from 'lucide-react';

interface Paciente {
  id: string;
  numeroExpediente: string;
  nombre: string;
  apellido: string;
  cedula: string | null;
  fechaNacimiento: string | null;
  telefono: string | null;
  tipoSangre: string | null;
  estado: string;
  _count: { consultas: number };
}

const ESTADO_LABEL: Record<string, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  ARCHIVADO: 'Archivado',
};

const ESTADO_COLOR: Record<string, string> = {
  ACTIVO: 'bg-emerald-100 text-emerald-700',
  INACTIVO: 'bg-slate-100 text-slate-600',
  ARCHIVADO: 'bg-red-100 text-red-700',
};

function calcularEdad(fechaNacimiento: string) {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (
    hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
  ) {
    edad--;
  }
  return edad;
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    const params = new URLSearchParams({ limit: '30' });
    if (busqueda) params.set('q', busqueda);
    try {
      const res = await fetch(`/api/clinica/pacientes?${params}`);
      const json = await res.json();
      if (json.success) setPacientes(json.data);
    } finally {
      setLoading(false);
    }
  }, [busqueda]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    setBusqueda(q);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pacientes</h1>
          <p className="text-sm text-slate-500">Gestión de expedientes médicos</p>
        </div>
        <Link
          href="/clinica/pacientes/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo paciente
        </Link>
      </div>

      {/* Búsqueda */}
      <form onSubmit={buscar} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, cédula o No. expediente..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Buscar
        </button>
        {busqueda && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setBusqueda('');
            }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Limpiar
          </button>
        )}
      </form>

      {/* Tabla */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">Cargando pacientes...</div>
      ) : pacientes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <UserRound className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-500">
            {busqueda
              ? 'No se encontraron pacientes con esa búsqueda.'
              : 'Aún no hay pacientes registrados.'}
          </p>
          {!busqueda && (
            <Link
              href="/clinica/pacientes/nuevo"
              className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
            >
              Registrar primer paciente
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Expediente</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Paciente</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Cédula</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Edad</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Consultas</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pacientes.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    #{p.numeroExpediente}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {p.nombre} {p.apellido}
                    </div>
                    {p.telefono && <div className="text-xs text-slate-500">{p.telefono}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.cedula ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.fechaNacimiento ? `${calcularEdad(p.fechaNacimiento)} años` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <FileText className="h-3.5 w-3.5" />
                      {p._count.consultas}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLOR[p.estado] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {ESTADO_LABEL[p.estado] ?? p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/clinica/pacientes/${p.id}`}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      Ver expediente
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
