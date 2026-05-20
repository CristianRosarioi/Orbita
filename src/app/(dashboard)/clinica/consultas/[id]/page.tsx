'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  numeroExpediente: string;
  cedula: string | null;
  fechaNacimiento: string | null;
  sexo: string | null;
  tipoSangre: string | null;
  alergias: string | null;
}

interface Factura {
  id: string;
  numero: string;
  total: string;
  estado: string;
}

interface Consulta {
  id: string;
  medicoNombre: string;
  fechaHora: string;
  motivo: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  receta: string | null;
  peso: string | null;
  talla: string | null;
  temperatura: string | null;
  frecuenciaCard: string | null;
  presionArterial: string | null;
  notas: string | null;
  estado: string;
  precio: string | null;
  facturaId: string | null;
  paciente: Paciente;
  factura: Factura | null;
}

const TIPO_SANGRE_LABEL: Record<string, string> = {
  A_POSITIVO: 'A+', A_NEGATIVO: 'A-', B_POSITIVO: 'B+', B_NEGATIVO: 'B-',
  AB_POSITIVO: 'AB+', AB_NEGATIVO: 'AB-', O_POSITIVO: 'O+', O_NEGATIVO: 'O-',
  DESCONOCIDO: '?',
};

const ESTADO_COLOR: Record<string, string> = {
  PROGRAMADA: 'bg-blue-100 text-blue-700',
  EN_CURSO: 'bg-amber-100 text-amber-700',
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-red-100 text-red-700',
  NO_ASISTIO: 'bg-slate-100 text-slate-600',
};

const ESTADO_LABEL: Record<string, string> = {
  PROGRAMADA: 'Programada', EN_CURSO: 'En curso', COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada', NO_ASISTIO: 'No asistió',
};

export default function ConsultaDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [facturando, setFacturando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const cargar = useCallback(() => {
    fetch(`/api/clinica/consultas/${id}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setConsulta(j.data); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarEstado = async (nuevoEstado: string) => {
    setActualizando(true);
    const res = await fetch(`/api/clinica/consultas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    const json = await res.json();
    if (json.success) {
      setConsulta((c) => c ? { ...c, estado: nuevoEstado } : c);
      setMensaje('Estado actualizado.');
    }
    setActualizando(false);
    setTimeout(() => setMensaje(''), 3000);
  };

  const facturar = async () => {
    setFacturando(true);
    const res = await fetch(`/api/clinica/consultas/${id}/facturar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metodoPago: 'EFECTIVO' }),
    });
    const json = await res.json();
    if (json.success) {
      setMensaje(`Factura ${json.data.numero} generada correctamente.`);
      cargar();
    } else {
      setMensaje(json.error?.message ?? 'Error al facturar.');
    }
    setFacturando(false);
    setTimeout(() => setMensaje(''), 5000);
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Cargando consulta...</div>;
  if (!consulta) return <div className="p-6 text-center text-red-600">Consulta no encontrada.</div>;

  const p = consulta.paciente;
  const signosVitales = [
    { label: 'Peso', value: consulta.peso ? `${consulta.peso} kg` : null },
    { label: 'Talla', value: consulta.talla ? `${consulta.talla} cm` : null },
    { label: 'Temperatura', value: consulta.temperatura ? `${consulta.temperatura}°C` : null },
    { label: 'Freq. cardíaca', value: consulta.frecuenciaCard ? `${consulta.frecuenciaCard} bpm` : null },
    { label: 'Presión arterial', value: consulta.presionArterial },
  ].filter((s) => s.value);

  return (
    <div className="p-6">
      {/* Cabecera */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clinica/consultas" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Consulta médica</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLOR[consulta.estado] ?? 'bg-slate-100'}`}>
                {ESTADO_LABEL[consulta.estado] ?? consulta.estado}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {new Date(consulta.fechaHora).toLocaleDateString('es-DO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {' · '}Dr./Dra. {consulta.medicoNombre}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {consulta.estado !== 'COMPLETADA' && consulta.estado !== 'CANCELADA' && (
            <>
              {consulta.estado === 'PROGRAMADA' && (
                <button
                  onClick={() => cambiarEstado('EN_CURSO')}
                  disabled={actualizando}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                >
                  Iniciar consulta
                </button>
              )}
              {consulta.estado === 'EN_CURSO' && (
                <button
                  onClick={() => cambiarEstado('COMPLETADA')}
                  disabled={actualizando}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                >
                  <CheckCircle className="mr-1 inline h-4 w-4" />
                  Completar
                </button>
              )}
              <button
                onClick={() => cambiarEstado('CANCELADA')}
                disabled={actualizando}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
            </>
          )}
          {consulta.estado === 'COMPLETADA' && !consulta.facturaId && (
            <button
              onClick={facturar}
              disabled={facturando}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <FileText className="h-4 w-4" />
              {facturando ? 'Facturando...' : 'Facturar'}
            </button>
          )}
          {consulta.factura && (
            <Link
              href={`/facturas/${consulta.factura.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <FileText className="h-4 w-4" />
              Ver factura {consulta.factura.numero}
            </Link>
          )}
        </div>
      </div>

      {mensaje && (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          {mensaje}
        </div>
      )}

      {/* 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: paciente + signos */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Paciente</h3>
            <Link href={`/clinica/pacientes/${p.id}`} className="font-medium text-indigo-600 hover:underline">
              {p.nombre} {p.apellido}
            </Link>
            <p className="text-xs text-slate-500 mt-0.5">#{p.numeroExpediente}</p>
            <dl className="mt-3 space-y-1.5 text-sm">
              {p.cedula && <div className="flex justify-between"><dt className="text-slate-500">Cédula</dt><dd className="text-slate-700">{p.cedula}</dd></div>}
              {p.sexo && <div className="flex justify-between"><dt className="text-slate-500">Sexo</dt><dd className="text-slate-700">{p.sexo}</dd></div>}
              {p.tipoSangre && <div className="flex justify-between"><dt className="text-slate-500">Sangre</dt><dd className="font-semibold text-red-600">{TIPO_SANGRE_LABEL[p.tipoSangre]}</dd></div>}
            </dl>
            {p.alergias && (
              <div className="mt-3 rounded-lg bg-amber-50 p-2">
                <p className="text-xs font-semibold text-amber-800">Alergias:</p>
                <p className="text-xs text-amber-700">{p.alergias}</p>
              </div>
            )}
          </div>

          {signosVitales.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 font-semibold text-slate-900">Signos vitales</h3>
              <dl className="space-y-2">
                {signosVitales.map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {consulta.precio && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-1 font-semibold text-slate-900">Costo de consulta</h3>
              <p className="text-2xl font-bold text-indigo-600">
                RD${Number(consulta.precio).toLocaleString('es-DO')}
              </p>
            </div>
          )}
        </div>

        {/* Columna derecha: notas clínicas */}
        <div className="space-y-4 lg:col-span-2">
          {consulta.motivo && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-2 font-semibold text-slate-900">Motivo de consulta</h3>
              <p className="text-sm leading-relaxed text-slate-700">{consulta.motivo}</p>
            </div>
          )}
          {consulta.diagnostico && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-2 font-semibold text-slate-900">Diagnóstico</h3>
              <p className="text-sm leading-relaxed text-slate-700">{consulta.diagnostico}</p>
            </div>
          )}
          {consulta.tratamiento && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-2 font-semibold text-slate-900">Tratamiento</h3>
              <p className="text-sm leading-relaxed text-slate-700">{consulta.tratamiento}</p>
            </div>
          )}
          {consulta.receta && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
              <h3 className="mb-2 font-semibold text-indigo-900">Receta médica</h3>
              <pre className="whitespace-pre-wrap text-sm text-indigo-800 font-sans">{consulta.receta}</pre>
            </div>
          )}
          {consulta.notas && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-2 font-semibold text-slate-900">Notas adicionales</h3>
              <p className="text-sm leading-relaxed text-slate-700">{consulta.notas}</p>
            </div>
          )}
          {!consulta.motivo && !consulta.diagnostico && !consulta.tratamiento && !consulta.receta && !consulta.notas && (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-500">
              No hay notas clínicas registradas para esta consulta.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
