'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  numeroExpediente: string;
  cedula: string | null;
}

function NuevaConsultaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteIdParam = searchParams.get('pacienteId');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [pacienteId, setPacienteId] = useState(pacienteIdParam ?? '');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [resultados, setResultados] = useState<Paciente[]>([]);
  const [buscando, setBuscando] = useState(false);

  const [form, setForm] = useState({
    medicoNombre: '',
    fechaHora: '',
    motivo: '',
    diagnostico: '',
    tratamiento: '',
    receta: '',
    peso: '',
    talla: '',
    temperatura: '',
    frecuenciaCard: '',
    presionArterial: '',
    notas: '',
    precio: '',
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  // Cargar paciente pre-seleccionado
  useEffect(() => {
    if (pacienteIdParam) {
      fetch(`/api/clinica/pacientes/${pacienteIdParam}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setPacienteSeleccionado(j.data);
        });
    }
  }, [pacienteIdParam]);

  const buscarPaciente = async (q: string) => {
    setBusquedaPaciente(q);
    if (q.length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const res = await fetch(`/api/clinica/pacientes?q=${encodeURIComponent(q)}&limit=6`);
    const json = await res.json();
    setResultados(json.success ? json.data : []);
    setBuscando(false);
  };

  const seleccionarPaciente = (p: Paciente) => {
    setPacienteId(p.id);
    setPacienteSeleccionado(p);
    setBusquedaPaciente('');
    setResultados([]);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) {
      setError('Debes seleccionar un paciente.');
      return;
    }
    setSaving(true);
    setError('');

    const body: Record<string, string | number> = { pacienteId };
    for (const [k, v] of Object.entries(form)) {
      if (v) body[k] = v;
    }
    if (body.fechaHora) {
      body.fechaHora = new Date(body.fechaHora as string).toISOString();
    }

    const res = await fetch('/api/clinica/consultas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (json.success) {
      router.push(`/clinica/consultas/${json.data.id}`);
    } else {
      setError(json.error?.message ?? 'Error al guardar la consulta.');
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/clinica/consultas" className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva consulta</h1>
          <p className="text-sm text-slate-500">Registrar una nueva consulta médica</p>
        </div>
      </div>

      <form onSubmit={guardar} className="mx-auto max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Selección de paciente */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Paciente</h2>
          {pacienteSeleccionado ? (
            <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 p-3">
              <div>
                <p className="font-medium text-indigo-900">
                  {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}
                </p>
                <p className="text-xs text-indigo-600">
                  #{pacienteSeleccionado.numeroExpediente}
                  {pacienteSeleccionado.cedula ? ` · ${pacienteSeleccionado.cedula}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPacienteId('');
                  setPacienteSeleccionado(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={busquedaPaciente}
                  onChange={(e) => buscarPaciente(e.target.value)}
                  placeholder="Buscar paciente por nombre o cédula..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              {(buscando || resultados.length > 0) && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                  {buscando ? (
                    <p className="px-4 py-3 text-sm text-slate-500">Buscando...</p>
                  ) : (
                    resultados.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => seleccionarPaciente(p)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {p.nombre} {p.apellido}
                          </p>
                          <p className="text-xs text-slate-500">
                            #{p.numeroExpediente}
                            {p.cedula ? ` · ${p.cedula}` : ''}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">
            ¿Paciente nuevo?{' '}
            <Link href="/clinica/pacientes/nuevo" className="text-indigo-600 hover:underline">
              Registrar primero
            </Link>
          </p>
        </div>

        {/* Datos de la consulta */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Datos de la consulta</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Médico *</label>
              <input
                required
                value={form.medicoNombre}
                onChange={(e) => set('medicoNombre', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fecha y hora *
              </label>
              <input
                required
                type="datetime-local"
                value={form.fechaHora}
                onChange={(e) => set('fechaHora', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Motivo de consulta
              </label>
              <input
                value={form.motivo}
                onChange={(e) => set('motivo', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Signos vitales */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Signos vitales</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ['peso', 'Peso (kg)'],
                ['talla', 'Talla (cm)'],
                ['temperatura', 'Temperatura (°C)'],
                ['frecuenciaCard', 'Freq. cardíaca (bpm)'],
                ['presionArterial', 'Presión arterial'],
              ] as [string, string][]
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
                <input
                  type={key === 'presionArterial' ? 'text' : 'number'}
                  step="0.1"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => set(key, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notas clínicas */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Notas clínicas</h2>
          <div className="space-y-4">
            {(
              [
                ['diagnostico', 'Diagnóstico', 3],
                ['tratamiento', 'Tratamiento', 3],
                ['receta', 'Receta médica', 4],
                ['notas', 'Notas adicionales', 2],
              ] as [string, string, number][]
            ).map(([key, label, rows]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
                <textarea
                  value={form[key as keyof typeof form]}
                  onChange={(e) => set(key, e.target.value)}
                  rows={rows}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Precio de la consulta (RD$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={(e) => set('precio', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/clinica/consultas"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Registrar consulta'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NuevaConsultaPage() {
  return (
    <Suspense>
      <NuevaConsultaForm />
    </Suspense>
  );
}
