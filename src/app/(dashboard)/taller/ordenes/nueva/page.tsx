'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NuevaOrdenTrabajoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    vehiculoMarca: '',
    vehiculoModelo: '',
    vehiculoAnio: '',
    vehiculoPlaca: '',
    vehiculoColor: '',
    kilometraje: '',
    descripcionFalla: '',
    tecnico: '',
    fechaPromesa: '',
    notas: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/taller/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          vehiculoAnio: form.vehiculoAnio ? parseInt(form.vehiculoAnio) : undefined,
          kilometraje: form.kilometraje ? parseInt(form.kilometraje) : undefined,
          fechaPromesa: form.fechaPromesa || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al crear la orden.');
        return;
      }
      router.push(`/taller/ordenes/${data.data.id}`);
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva orden de trabajo</h1>
        <p className="text-slate-500 text-sm mt-1">Registra la entrada de un vehículo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg border border-slate-200 p-6">
        {/* Vehículo */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Vehículo</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoMarca">Marca *</Label>
              <Input id="vehiculoMarca" value={form.vehiculoMarca} onChange={(e) => set('vehiculoMarca', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoModelo">Modelo *</Label>
              <Input id="vehiculoModelo" value={form.vehiculoModelo} onChange={(e) => set('vehiculoModelo', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoPlaca">Placa *</Label>
              <Input
                id="vehiculoPlaca"
                value={form.vehiculoPlaca}
                onChange={(e) => set('vehiculoPlaca', e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoAnio">Año</Label>
              <Input id="vehiculoAnio" type="number" min="1900" max="2100" value={form.vehiculoAnio} onChange={(e) => set('vehiculoAnio', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoColor">Color</Label>
              <Input id="vehiculoColor" value={form.vehiculoColor} onChange={(e) => set('vehiculoColor', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kilometraje">Kilometraje</Label>
            <Input id="kilometraje" type="number" min="0" value={form.kilometraje} onChange={(e) => set('kilometraje', e.target.value)} />
          </div>
        </div>

        {/* Cliente */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cliente</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="clienteNombre">Nombre *</Label>
              <Input id="clienteNombre" value={form.clienteNombre} onChange={(e) => set('clienteNombre', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clienteTelefono">Teléfono</Label>
              <Input id="clienteTelefono" value={form.clienteTelefono} onChange={(e) => set('clienteTelefono', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Servicio */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Servicio</h2>
          <div className="space-y-1.5">
            <Label htmlFor="descripcionFalla">Descripción de la falla *</Label>
            <textarea
              id="descripcionFalla"
              value={form.descripcionFalla}
              onChange={(e) => set('descripcionFalla', e.target.value)}
              rows={3}
              required
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              placeholder="Describe el problema que presenta el vehículo..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tecnico">Técnico asignado</Label>
              <Input id="tecnico" value={form.tecnico} onChange={(e) => set('tecnico', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaPromesa">Fecha promesa de entrega</Label>
              <Input id="fechaPromesa" type="date" value={form.fechaPromesa} onChange={(e) => set('fechaPromesa', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas internas</Label>
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
            {loading ? 'Creando...' : 'Crear orden'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
