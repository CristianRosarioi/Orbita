'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EmpresaData {
  id: string;
  nombre: string;
  nombreComercial: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  logoUrl: string | null;
  modoFiscal: string;
  rnc: string | null;
}

export default function ConfigEmpresaPage() {
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    nombreComercial: '',
    telefono: '',
    email: '',
    direccion: '',
    logoUrl: '',
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    fetch('/api/empresas/activa')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const e: EmpresaData = d.data;
          setEmpresa(e);
          setForm({
            nombre: e.nombre ?? '',
            nombreComercial: e.nombreComercial ?? '',
            telefono: e.telefono ?? '',
            email: e.email ?? '',
            direccion: e.direccion ?? '',
            logoUrl: e.logoUrl ?? '',
          });
        }
      })
      .finally(() => setCargando(false));
  }, []);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      const payload: Record<string, string | null> = {
        nombre: form.nombre || null,
        nombreComercial: form.nombreComercial || null,
        telefono: form.telefono || null,
        email: form.email || null,
        direccion: form.direccion || null,
        logoUrl: form.logoUrl || null,
      };

      const res = await fetch('/api/empresas/activa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.success) {
        setEmpresa(d.data);
        setMensaje({ tipo: 'ok', texto: 'Datos actualizados correctamente.' });
      } else {
        setMensaje({ tipo: 'error', texto: d.error?.message ?? 'Error al guardar.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Cargando datos de la empresa...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-slate-700" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mi empresa</h1>
          <p className="text-slate-500 text-sm mt-0.5">Actualiza la información de tu empresa</p>
        </div>
      </div>

      {mensaje && (
        <div
          className={`rounded-lg border px-4 py-3 flex items-start gap-3 text-sm ${
            mensaje.tipo === 'ok'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {mensaje.tipo === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={guardar} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre legal *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={set('nombre')}
                required
                minLength={2}
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nombreComercial">Nombre comercial</Label>
              <Input
                id="nombreComercial"
                value={form.nombreComercial}
                onChange={set('nombreComercial')}
                maxLength={100}
                placeholder="Nombre que aparece en facturas"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={form.telefono}
                  onChange={set('telefono')}
                  maxLength={20}
                  placeholder="809-000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  maxLength={100}
                  placeholder="empresa@ejemplo.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={form.direccion}
                onChange={set('direccion')}
                maxLength={300}
                placeholder="Calle, sector, ciudad, provincia"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logoUrl">URL del logo</Label>
              <Input
                id="logoUrl"
                value={form.logoUrl}
                onChange={set('logoUrl')}
                maxLength={500}
                placeholder="https://ejemplo.com/logo.png"
              />
              <p className="text-xs text-slate-400">
                La subida de imágenes directamente estará disponible próximamente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Datos fiscales (solo lectura) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Datos fiscales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-500">RNC</Label>
                <p className="text-sm font-mono bg-slate-50 border rounded-md px-3 py-2 text-slate-700">
                  {empresa?.rnc ?? 'No registrado'}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-500">Modo fiscal</Label>
                <p className="text-sm bg-slate-50 border rounded-md px-3 py-2 text-slate-700">
                  {empresa?.modoFiscal === 'FISCAL' ? 'Fiscal (DGII activo)' : 'Simple'}
                </p>
              </div>
            </div>
            {empresa?.modoFiscal === 'SIMPLE' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Para activar el Modo Fiscal y emitir comprobantes NCF válidos, contacta a soporte o
                actualiza tu plan.
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={guardando} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>
    </div>
  );
}
