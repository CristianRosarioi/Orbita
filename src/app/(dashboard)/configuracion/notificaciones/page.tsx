'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, MessageCircle, Mail, Save, Send, CheckCircle, ExternalLink } from 'lucide-react';

interface Config {
  whatsappActivo: boolean;
  emailActivo: boolean;
  whatsappNumero: string | null;
  whatsappApiKey: string | null;
  emailRemitente: string | null;
  notifFacturas: boolean;
  notifVencimientos: boolean;
  notifCitas: boolean;
  notifStockBajo: boolean;
  notifNomina: boolean;
}

function Toggle({
  value,
  onChange,
  label,
  desc,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-indigo-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function NotificacionesConfigPage() {
  const [config, setConfig] = useState<Config>({
    whatsappActivo: false,
    emailActivo: false,
    whatsappNumero: '',
    whatsappApiKey: '',
    emailRemitente: '',
    notifFacturas: true,
    notifVencimientos: true,
    notifCitas: true,
    notifStockBajo: true,
    notifNomina: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Test
  const [testCanal, setTestCanal] = useState<'WHATSAPP' | 'EMAIL'>('EMAIL');
  const [testDest, setTestDest] = useState('');
  const [testEnviando, setTestEnviando] = useState(false);
  const [testOk, setTestOk] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/notificaciones/config');
      const json = await res.json();
      if (json.success) {
        setConfig({
          whatsappActivo:    json.data.whatsappActivo ?? false,
          emailActivo:       json.data.emailActivo ?? false,
          whatsappNumero:    json.data.whatsappNumero ?? '',
          whatsappApiKey:    json.data.whatsappApiKey ?? '',
          emailRemitente:    json.data.emailRemitente ?? '',
          notifFacturas:     json.data.notifFacturas ?? true,
          notifVencimientos: json.data.notifVencimientos ?? true,
          notifCitas:        json.data.notifCitas ?? true,
          notifStockBajo:    json.data.notifStockBajo ?? true,
          notifNomina:       json.data.notifNomina ?? false,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    const res = await fetch('/api/notificaciones/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        whatsappNumero:  config.whatsappNumero  || null,
        whatsappApiKey:  config.whatsappApiKey  || null,
        emailRemitente:  config.emailRemitente  || null,
      }),
    });
    const json = await res.json();
    if (json.success) setSaved(true);
    else setError(json.error?.message ?? 'Error al guardar la configuración.');
    setSaving(false);
  };

  const enviarPrueba = async () => {
    if (!testDest) return;
    setTestEnviando(true);
    setTestOk(false);
    const res = await fetch('/api/notificaciones/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canal: testCanal, destinatario: testDest }),
    });
    const json = await res.json();
    if (json.success) setTestOk(true);
    setTestEnviando(false);
  };

  const set = <K extends keyof Config>(k: K, v: Config[K]) =>
    setConfig((prev) => ({ ...prev, [k]: v }));

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Cargando configuración...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notificaciones</h1>
        <p className="text-sm text-slate-500">
          Configura el envío automático de mensajes a tus clientes
        </p>
      </div>

      <form onSubmit={guardar} className="mx-auto max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            Configuración guardada correctamente.
          </div>
        )}

        {/* WhatsApp */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">WhatsApp</h2>
              <p className="text-xs text-slate-500">Vía CallMeBot (gratuito)</p>
            </div>
            <Toggle
              value={config.whatsappActivo}
              onChange={(v) => set('whatsappActivo', v)}
              label=""
            />
          </div>

          {config.whatsappActivo && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Número de WhatsApp (formato internacional)
                </label>
                <input
                  value={config.whatsappNumero ?? ''}
                  onChange={(e) => set('whatsappNumero', e.target.value)}
                  placeholder="18095551234"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-400">Ej: 18095551234 (sin +, sin guiones)</p>
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                  API Key de CallMeBot
                  <a
                    href="https://www.callmebot.com/blog/free-api-whatsapp-messages/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex items-center gap-0.5 text-xs text-indigo-600 hover:underline"
                  >
                    Cómo obtenerla
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </label>
                <input
                  type="password"
                  value={config.whatsappApiKey ?? ''}
                  onChange={(e) => set('whatsappApiKey', e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">Email</h2>
              <p className="text-xs text-slate-500">Vía Resend</p>
            </div>
            <Toggle
              value={config.emailActivo}
              onChange={(v) => set('emailActivo', v)}
              label=""
            />
          </div>

          {config.emailActivo && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email del remitente
                </label>
                <input
                  type="email"
                  value={config.emailRemitente ?? ''}
                  onChange={(e) => set('emailRemitente', e.target.value)}
                  placeholder="notificaciones@tuempresa.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                  API Key de Resend
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex items-center gap-0.5 text-xs text-indigo-600 hover:underline"
                  >
                    Obtener en Resend
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </label>
                <p className="mb-1 text-xs text-slate-400">
                  La API Key se configura en la variable de entorno <code className="rounded bg-slate-100 px-1">RESEND_API_KEY</code> del servidor.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ¿Qué notificar? */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
              <Bell className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="font-semibold text-slate-900">¿Qué notificar?</h2>
          </div>
          <div className="divide-y divide-slate-100">
            <Toggle
              value={config.notifFacturas}
              onChange={(v) => set('notifFacturas', v)}
              label="Facturas emitidas"
              desc="Notifica al cliente cuando se emite una factura"
            />
            <Toggle
              value={config.notifVencimientos}
              onChange={(v) => set('notifVencimientos', v)}
              label="Facturas vencidas"
              desc="Alerta cuando una factura supera su fecha de vencimiento"
            />
            <Toggle
              value={config.notifCitas}
              onChange={(v) => set('notifCitas', v)}
              label="Recordatorio de citas"
              desc="24 horas antes de la cita programada"
            />
            <Toggle
              value={config.notifStockBajo}
              onChange={(v) => set('notifStockBajo', v)}
              label="Stock bajo"
              desc="Cuando un producto baja del mínimo configurado"
            />
            <Toggle
              value={config.notifNomina}
              onChange={(v) => set('notifNomina', v)}
              label="Nómina procesada"
              desc="Al completar el procesamiento de nómina"
            />
          </div>
        </div>

        {/* Notificación de prueba */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Enviar notificación de prueba</h2>
          <div className="flex gap-3">
            <select
              value={testCanal}
              onChange={(e) => setTestCanal(e.target.value as 'WHATSAPP' | 'EMAIL')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
            <input
              value={testDest}
              onChange={(e) => setTestDest(e.target.value)}
              placeholder={testCanal === 'EMAIL' ? 'ejemplo@correo.com' : '18095551234'}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={enviarPrueba}
              disabled={testEnviando || !testDest}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {testEnviando ? 'Enviando...' : 'Enviar prueba'}
            </button>
          </div>
          {testOk && (
            <p className="mt-2 text-sm text-emerald-600">
              Notificación de prueba enviada correctamente.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
