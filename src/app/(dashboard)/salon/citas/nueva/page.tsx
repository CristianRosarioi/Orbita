'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DURACIONES = [15, 30, 45, 60, 90, 120, 180];

export default function NuevaCitaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}T09:00`;

  const [form, setForm] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    servicio: '',
    fecha: fechaHoy,
    duracionMin: '60',
    precio: '',
    notas: '',
  });

  function set(f: string, v: string) {
    setForm((p) => ({ ...p, [f]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/salon/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: form.clienteNombre,
          clienteTelefono: form.clienteTelefono || undefined,
          servicio: form.servicio,
          fecha: form.fecha,
          duracionMin: parseInt(form.duracionMin),
          precio: parseFloat(form.precio),
          notas: form.notas || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al crear la cita.');
        return;
      }
      router.push(`/salon/citas/${data.data.id}`);
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva cita</h1>
        <p className="text-slate-500 text-sm mt-1">Agenda un nuevo servicio para un cliente.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white rounded-lg border border-slate-200 p-6"
      >
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cliente</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="clienteNombre">Nombre *</Label>
              <Input
                id="clienteNombre"
                value={form.clienteNombre}
                onChange={(e) => set('clienteNombre', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clienteTelefono">Teléfono</Label>
              <Input
                id="clienteTelefono"
                value={form.clienteTelefono}
                onChange={(e) => set('clienteTelefono', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Servicio</h2>
          <div className="space-y-1.5">
            <Label htmlFor="servicio">Servicio *</Label>
            <Input
              id="servicio"
              value={form.servicio}
              onChange={(e) => set('servicio', e.target.value)}
              placeholder="Ej: Corte de cabello, Tinte, Manicure..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha y hora *</Label>
              <Input
                id="fecha"
                type="datetime-local"
                value={form.fecha}
                onChange={(e) => set('fecha', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duración</Label>
              <Select value={form.duracionMin} onValueChange={(v) => set('duracionMin', v ?? '60')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURACIONES.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d < 60 ? `${d} min` : `${d / 60}h${d % 60 ? ` ${d % 60}min` : ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="precio">Precio (RD$) *</Label>
            <Input
              id="precio"
              type="number"
              min="0.01"
              step="0.01"
              value={form.precio}
              onChange={(e) => set('precio', e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas</Label>
            <textarea
              id="notas"
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Agendando...' : 'Agendar cita'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
