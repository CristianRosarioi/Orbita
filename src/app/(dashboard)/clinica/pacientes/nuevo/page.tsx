'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const TIPOS_SANGRE = [
  { value: 'A_POSITIVO', label: 'A+' },
  { value: 'A_NEGATIVO', label: 'A-' },
  { value: 'B_POSITIVO', label: 'B+' },
  { value: 'B_NEGATIVO', label: 'B-' },
  { value: 'AB_POSITIVO', label: 'AB+' },
  { value: 'AB_NEGATIVO', label: 'AB-' },
  { value: 'O_POSITIVO', label: 'O+' },
  { value: 'O_NEGATIVO', label: 'O-' },
  { value: 'DESCONOCIDO', label: 'Desconocido' },
];

export default function NuevoPacientePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    fechaNacimiento: '',
    sexo: '',
    telefono: '',
    email: '',
    direccion: '',
    tipoSangre: '',
    alergias: '',
    antecedentes: '',
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v) body[k] = v;
    }

    const res = await fetch('/api/clinica/pacientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (json.success) {
      router.push(`/clinica/pacientes/${json.data.id}`);
    } else {
      setError(json.error?.message ?? 'Error al guardar el paciente.');
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/clinica/pacientes" className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo paciente</h1>
          <p className="text-sm text-slate-500">Registro de expediente médico</p>
        </div>
      </div>

      <form onSubmit={guardar} className="mx-auto max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Datos personales */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Datos personales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Apellido *</label>
              <input
                required
                value={form.apellido}
                onChange={(e) => set('apellido', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cédula</label>
              <input
                value={form.cedula}
                onChange={(e) => set('cedula', e.target.value)}
                placeholder="00000000000"
                maxLength={11}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={form.fechaNacimiento}
                onChange={(e) => set('fechaNacimiento', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Sexo</label>
              <select
                value={form.sexo}
                onChange={(e) => set('sexo', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Seleccionar...</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tipo de sangre
              </label>
              <select
                value={form.tipoSangre}
                onChange={(e) => set('tipoSangre', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Seleccionar...</option>
                {TIPOS_SANGRE.map((ts) => (
                  <option key={ts.value} value={ts.value}>
                    {ts.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Contacto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => set('telefono', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Dirección</label>
              <input
                value={form.direccion}
                onChange={(e) => set('direccion', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Historial médico */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Historial médico</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Alergias conocidas
              </label>
              <textarea
                value={form.alergias}
                onChange={(e) => set('alergias', e.target.value)}
                rows={3}
                placeholder="Ej: Penicilina, aspirina, látex..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Antecedentes médicos
              </label>
              <textarea
                value={form.antecedentes}
                onChange={(e) => set('antecedentes', e.target.value)}
                rows={4}
                placeholder="Enfermedades previas, cirugías, condiciones crónicas..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/clinica/pacientes"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Registrar paciente'}
          </button>
        </div>
      </form>
    </div>
  );
}
