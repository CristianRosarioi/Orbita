'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Stethoscope, Activity, FileText } from 'lucide-react';

interface Consulta {
  id: string;
  medicoNombre: string;
  fechaHora: string;
  motivo: string | null;
  diagnostico: string | null;
  estado: string;
  precio: string | null;
  facturaId: string | null;
}

interface Paciente {
  id: string;
  numeroExpediente: string;
  nombre: string;
  apellido: string;
  cedula: string | null;
  fechaNacimiento: string | null;
  sexo: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  tipoSangre: string | null;
  alergias: string | null;
  antecedentes: string | null;
  estado: string;
  consultas: Consulta[];
}

const ESTADO_CONSULTA_COLOR: Record<string, string> = {
  PROGRAMADA: 'bg-blue-100 text-blue-700',
  EN_CURSO: 'bg-amber-100 text-amber-700',
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-red-100 text-red-700',
  NO_ASISTIO: 'bg-slate-100 text-slate-600',
};

const TIPO_SANGRE_LABEL: Record<string, string> = {
  A_POSITIVO: 'A+', A_NEGATIVO: 'A-',
  B_POSITIVO: 'B+', B_NEGATIVO: 'B-',
  AB_POSITIVO: 'AB+', AB_NEGATIVO: 'AB-',
  O_POSITIVO: 'O+', O_NEGATIVO: 'O-',
  DESCONOCIDO: 'Desconocido',
};

function calcularEdad(fecha: string) {
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

type Tab = 'resumen' | 'historial' | 'signos';

export default function PacienteExpedientePage() {
  const params = useParams();
  const id = params.id as string;
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('resumen');

  useEffect(() => {
    fetch(`/api/clinica/pacientes/${id}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setPaciente(j.data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-center text-slate-500">Cargando expediente...</div>;
  if (!paciente) return <div className="p-6 text-center text-red-600">Expediente no encontrado.</div>;

  const consultasConSignos = paciente.consultas.filter((c) => c.diagnostico);

  return (
    <div className="p-6">
      {/* Cabecera */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clinica/pacientes" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{paciente.nombre} {paciente.apellido}</h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                #{paciente.numeroExpediente}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {paciente.cedula ? `Cédula: ${paciente.cedula}` : 'Sin cédula registrada'}
              {paciente.fechaNacimiento ? ` · ${calcularEdad(paciente.fechaNacimiento)} años` : ''}
            </p>
          </div>
        </div>
        <Link
          href={`/clinica/consultas/nueva?pacienteId=${paciente.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva consulta
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {([['resumen', 'Resumen'], ['historial', 'Historial'], ['signos', 'Signos vitales']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Resumen */}
      {tab === 'resumen' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-slate-900">Datos personales</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Sexo</dt>
                  <dd className="font-medium text-slate-900">{paciente.sexo ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tipo de sangre</dt>
                  <dd className="font-medium text-red-600">
                    {paciente.tipoSangre ? TIPO_SANGRE_LABEL[paciente.tipoSangre] : '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Teléfono</dt>
                  <dd className="font-medium text-slate-900">{paciente.telefono ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium text-slate-900">{paciente.email ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Dirección</dt>
                  <dd className="font-medium text-slate-900">{paciente.direccion ?? '—'}</dd>
                </div>
              </dl>
            </div>

            {paciente.tipoSangre && paciente.tipoSangre !== 'DESCONOCIDO' && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-700">
                    Tipo de sangre: {TIPO_SANGRE_LABEL[paciente.tipoSangre]}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {paciente.alergias && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="mb-2 font-semibold text-amber-900">Alergias</h3>
                <p className="text-sm text-amber-800">{paciente.alergias}</p>
              </div>
            )}
            {paciente.antecedentes && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="mb-2 font-semibold text-slate-900">Antecedentes médicos</h3>
                <p className="text-sm leading-relaxed text-slate-700">{paciente.antecedentes}</p>
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-2 font-semibold text-slate-900">Estadísticas</h3>
              <p className="text-3xl font-bold text-indigo-600">{paciente.consultas.length}</p>
              <p className="text-sm text-slate-500">consultas registradas</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Historial */}
      {tab === 'historial' && (
        <div className="space-y-3">
          {paciente.consultas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <Stethoscope className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-slate-500">No hay consultas registradas aún.</p>
            </div>
          ) : (
            paciente.consultas.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(c.fechaHora).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_CONSULTA_COLOR[c.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                        {c.estado.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">Dr./Dra. {c.medicoNombre}</p>
                    {c.motivo && <p className="mt-1 text-sm text-slate-700"><strong>Motivo:</strong> {c.motivo}</p>}
                    {c.diagnostico && <p className="mt-1 text-sm text-slate-700"><strong>Diagnóstico:</strong> {c.diagnostico}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {c.precio && <span className="text-sm font-semibold text-slate-900">RD${Number(c.precio).toLocaleString('es-DO')}</span>}
                    {c.facturaId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                        <FileText className="h-3 w-3" /> Facturada
                      </span>
                    )}
                    <Link href={`/clinica/consultas/${c.id}`} className="text-xs text-indigo-600 hover:underline">
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Signos vitales */}
      {tab === 'signos' && (
        <div>
          {consultasConSignos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <Activity className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-slate-500">No hay registros de signos vitales aún.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700">Fecha</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Médico</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Diagnóstico</th>
                    <th className="px-4 py-3 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consultasConSignos.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(c.fechaHora).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.medicoNombre}</td>
                      <td className="px-4 py-3 text-slate-700">{c.diagnostico}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/clinica/consultas/${c.id}`} className="text-xs text-indigo-600 hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
