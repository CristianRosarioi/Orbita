'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car } from 'lucide-react';

const SERVICIOS_CARWASH = [
  'Lavado básico exterior',
  'Lavado completo interior/exterior',
  'Lavado premium con encerado',
  'Lavado de motor',
  'Pulido y brillado',
  'Aspirado interior',
  'Lavado de tapicería',
];

export default function NuevaOrdenCarwashPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    vehiculoPlaca: '',
    vehiculoMarca: '',
    vehiculoModelo: '',
    vehiculoColor: '',
    tipoServicio: '',
    servicioPersonalizado: '',
    duracionMin: '30',
    precio: '',
    empleadoAsignado: '',
    notas: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const tipoServicio = form.tipoServicio === 'otro' ? form.servicioPersonalizado : form.tipoServicio;

    try {
      const res = await fetch('/api/carwash/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: form.clienteNombre,
          clienteTelefono: form.clienteTelefono || undefined,
          vehiculoPlaca: form.vehiculoPlaca,
          vehiculoMarca: form.vehiculoMarca || undefined,
          vehiculoModelo: form.vehiculoModelo || undefined,
          vehiculoColor: form.vehiculoColor || undefined,
          tipoServicio,
          duracionMin: parseInt(form.duracionMin) || 30,
          precio: parseFloat(form.precio),
          empleadoAsignado: form.empleadoAsignado || undefined,
          notas: form.notas || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al crear la orden.');
        return;
      }
      router.push(`/carwash/ordenes/${data.data.id}`);
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <Car className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nueva orden de carwash</h1>
          <p className="text-sm text-slate-500">Registra el vehículo en la cola</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Datos del cliente</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="clienteNombre">Nombre *</Label>
              <Input
                id="clienteNombre"
                value={form.clienteNombre}
                onChange={(e) => set('clienteNombre', e.target.value)}
                placeholder="Nombre del cliente"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clienteTelefono">Teléfono</Label>
              <Input
                id="clienteTelefono"
                value={form.clienteTelefono}
                onChange={(e) => set('clienteTelefono', e.target.value)}
                placeholder="809-000-0000"
              />
            </div>
          </div>
        </div>

        {/* Vehículo */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Datos del vehículo</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoPlaca">Placa *</Label>
              <Input
                id="vehiculoPlaca"
                value={form.vehiculoPlaca}
                onChange={(e) => set('vehiculoPlaca', e.target.value.toUpperCase())}
                placeholder="A000000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoColor">Color</Label>
              <Input
                id="vehiculoColor"
                value={form.vehiculoColor}
                onChange={(e) => set('vehiculoColor', e.target.value)}
                placeholder="Rojo, azul..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoMarca">Marca</Label>
              <Input
                id="vehiculoMarca"
                value={form.vehiculoMarca}
                onChange={(e) => set('vehiculoMarca', e.target.value)}
                placeholder="Toyota, Honda..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoModelo">Modelo</Label>
              <Input
                id="vehiculoModelo"
                value={form.vehiculoModelo}
                onChange={(e) => set('vehiculoModelo', e.target.value)}
                placeholder="Corolla, Civic..."
              />
            </div>
          </div>
        </div>

        {/* Servicio */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Servicio</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="tipoServicio">Tipo de servicio *</Label>
              <select
                id="tipoServicio"
                value={form.tipoServicio}
                onChange={(e) => set('tipoServicio', e.target.value)}
                required
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecciona un servicio</option>
                {SERVICIOS_CARWASH.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="otro">Otro (especificar)</option>
              </select>
            </div>
            {form.tipoServicio === 'otro' && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="servicioPersonalizado">Descripción del servicio *</Label>
                <Input
                  id="servicioPersonalizado"
                  value={form.servicioPersonalizado}
                  onChange={(e) => set('servicioPersonalizado', e.target.value)}
                  placeholder="Describe el servicio"
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="precio">Precio (RD$) *</Label>
              <Input
                id="precio"
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={(e) => set('precio', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duracionMin">Duración (minutos)</Label>
              <Input
                id="duracionMin"
                type="number"
                min="5"
                max="480"
                value={form.duracionMin}
                onChange={(e) => set('duracionMin', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="empleadoAsignado">Empleado asignado</Label>
              <Input
                id="empleadoAsignado"
                value={form.empleadoAsignado}
                onChange={(e) => set('empleadoAsignado', e.target.value)}
                placeholder="Nombre del empleado"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                value={form.notas}
                onChange={(e) => set('notas', e.target.value)}
                rows={2}
                placeholder="Observaciones adicionales..."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? 'Registrando...' : 'Agregar a la cola'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
