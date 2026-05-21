'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package } from 'lucide-react';

export default function NuevoRepuestoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    marca: '',
    marcaVehiculo: '',
    modeloVehiculo: '',
    anioDesde: '',
    anioHasta: '',
    precio: '',
    precioMayor: '',
    stock: '0',
    stockMinimo: '2',
    ubicacion: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/repuestos/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: form.codigo,
          nombre: form.nombre,
          descripcion: form.descripcion || undefined,
          marca: form.marca || undefined,
          marcaVehiculo: form.marcaVehiculo || undefined,
          modeloVehiculo: form.modeloVehiculo || undefined,
          anioDesde: form.anioDesde ? parseInt(form.anioDesde) : undefined,
          anioHasta: form.anioHasta ? parseInt(form.anioHasta) : undefined,
          precio: parseFloat(form.precio),
          precioMayor: form.precioMayor ? parseFloat(form.precioMayor) : undefined,
          stock: parseInt(form.stock) || 0,
          stockMinimo: parseInt(form.stockMinimo) || 2,
          ubicacion: form.ubicacion || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al crear el repuesto.');
        return;
      }
      router.push('/repuestos/inventario');
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
          <Package className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nuevo repuesto</h1>
          <p className="text-sm text-slate-500">Agrega un repuesto al inventario</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificación */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Identificación</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={form.codigo}
                onChange={(e) => set('codigo', e.target.value.toUpperCase())}
                placeholder="REP-001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="marca">Marca del repuesto</Label>
              <Input
                id="marca"
                value={form.marca}
                onChange={(e) => set('marca', e.target.value)}
                placeholder="Bosch, NGK..."
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                placeholder="Filtro de aceite, bujía..."
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                value={form.descripcion}
                onChange={(e) => set('descripcion', e.target.value)}
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Detalles adicionales..."
              />
            </div>
          </div>
        </div>

        {/* Compatibilidad vehicular */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Compatibilidad vehicular</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="marcaVehiculo">Marca del vehículo</Label>
              <Input
                id="marcaVehiculo"
                value={form.marcaVehiculo}
                onChange={(e) => set('marcaVehiculo', e.target.value)}
                placeholder="Toyota, Honda..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modeloVehiculo">Modelo</Label>
              <Input
                id="modeloVehiculo"
                value={form.modeloVehiculo}
                onChange={(e) => set('modeloVehiculo', e.target.value)}
                placeholder="Corolla, Civic..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anioDesde">Año desde</Label>
              <Input
                id="anioDesde"
                type="number"
                min="1900"
                max="2100"
                value={form.anioDesde}
                onChange={(e) => set('anioDesde', e.target.value)}
                placeholder="2010"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anioHasta">Año hasta</Label>
              <Input
                id="anioHasta"
                type="number"
                min="1900"
                max="2100"
                value={form.anioHasta}
                onChange={(e) => set('anioHasta', e.target.value)}
                placeholder="2024"
              />
            </div>
          </div>
        </div>

        {/* Precios e inventario */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Precios e inventario</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="precio">Precio detalle (RD$) *</Label>
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
              <Label htmlFor="precioMayor">Precio al mayor (RD$)</Label>
              <Input
                id="precioMayor"
                type="number"
                min="0"
                step="0.01"
                value={form.precioMayor}
                onChange={(e) => set('precioMayor', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock inicial</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stockMinimo">Stock mínimo</Label>
              <Input
                id="stockMinimo"
                type="number"
                min="0"
                value={form.stockMinimo}
                onChange={(e) => set('stockMinimo', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ubicacion">Ubicación en almacén</Label>
              <Input
                id="ubicacion"
                value={form.ubicacion}
                onChange={(e) => set('ubicacion', e.target.value)}
                placeholder="Estante A, pasillo 3..."
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar repuesto'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
