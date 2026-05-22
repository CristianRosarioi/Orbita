'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Plus, Trash2 } from 'lucide-react';

interface ItemForm {
  descripcion: string;
  cantidad: string;
  precioUnitario: string;
  itbisPorcentaje: string;
}

function calcItem(item: ItemForm) {
  const qty = parseFloat(item.cantidad) || 0;
  const precio = parseFloat(item.precioUnitario) || 0;
  const itbis = parseFloat(item.itbisPorcentaje) || 0;
  const subtotal = qty * precio;
  const itbisMonto = subtotal * (itbis / 100);
  return { subtotal, itbisMonto, total: subtotal + itbisMonto };
}

export default function NuevaCotizacionPage() {
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
    notas: '',
    validaHasta: '',
  });

  const [items, setItems] = useState<ItemForm[]>([
    { descripcion: '', cantidad: '1', precioUnitario: '', itbisPorcentaje: '18' },
  ]);

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setItem(index: number, field: keyof ItemForm, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { descripcion: '', cantidad: '1', precioUnitario: '', itbisPorcentaje: '18' },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totales = items.reduce(
    (acc, item) => {
      const c = calcItem(item);
      return {
        subtotal: acc.subtotal + c.subtotal,
        itbis: acc.itbis + c.itbisMonto,
        total: acc.total + c.total,
      };
    },
    { subtotal: 0, itbis: 0, total: 0 },
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.some((it) => !it.descripcion || !it.precioUnitario || !it.cantidad)) {
      setError('Completa todos los campos de los ítems.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/repuestos/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: form.clienteNombre,
          clienteTelefono: form.clienteTelefono || undefined,
          vehiculoMarca: form.vehiculoMarca || undefined,
          vehiculoModelo: form.vehiculoModelo || undefined,
          vehiculoAnio: form.vehiculoAnio ? parseInt(form.vehiculoAnio) : undefined,
          vehiculoPlaca: form.vehiculoPlaca || undefined,
          notas: form.notas || undefined,
          validaHasta: form.validaHasta ? new Date(form.validaHasta).toISOString() : undefined,
          items: items.map((it) => ({
            descripcion: it.descripcion,
            cantidad: parseInt(it.cantidad),
            precioUnitario: parseFloat(it.precioUnitario),
            itbisPorcentaje: parseFloat(it.itbisPorcentaje),
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al crear la cotización.');
        return;
      }
      router.push(`/repuestos/cotizaciones/${data.data.id}`);
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
          <FileText className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nueva cotización</h1>
          <p className="text-sm text-slate-500">Crea una cotización de repuestos para un cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Cliente</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="clienteNombre">Nombre *</Label>
              <Input
                id="clienteNombre"
                value={form.clienteNombre}
                onChange={(e) => setField('clienteNombre', e.target.value)}
                placeholder="Nombre del cliente"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clienteTelefono">Teléfono</Label>
              <Input
                id="clienteTelefono"
                value={form.clienteTelefono}
                onChange={(e) => setField('clienteTelefono', e.target.value)}
                placeholder="809-000-0000"
              />
            </div>
          </div>
        </div>

        {/* Vehículo */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Vehículo (opcional)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoMarca">Marca</Label>
              <Input
                id="vehiculoMarca"
                value={form.vehiculoMarca}
                onChange={(e) => setField('vehiculoMarca', e.target.value)}
                placeholder="Toyota..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoModelo">Modelo</Label>
              <Input
                id="vehiculoModelo"
                value={form.vehiculoModelo}
                onChange={(e) => setField('vehiculoModelo', e.target.value)}
                placeholder="Corolla..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoAnio">Año</Label>
              <Input
                id="vehiculoAnio"
                type="number"
                min="1900"
                max="2100"
                value={form.vehiculoAnio}
                onChange={(e) => setField('vehiculoAnio', e.target.value)}
                placeholder="2020"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehiculoPlaca">Placa</Label>
              <Input
                id="vehiculoPlaca"
                value={form.vehiculoPlaca}
                onChange={(e) => setField('vehiculoPlaca', e.target.value.toUpperCase())}
                placeholder="A000000"
              />
            </div>
          </div>
        </div>

        {/* Ítems */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Ítems</h2>
          <div className="space-y-3">
            {items.map((item, idx) => {
              const c = calcItem(item);
              return (
                <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-5">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Descripción *</Label>
                      <Input
                        value={item.descripcion}
                        onChange={(e) => setItem(idx, 'descripcion', e.target.value)}
                        placeholder="Filtro de aceite..."
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cant. *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => setItem(idx, 'cantidad', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Precio *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precioUnitario}
                        onChange={(e) => setItem(idx, 'precioUnitario', e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ITBIS %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.itbisPorcentaje}
                        onChange={(e) => setItem(idx, 'itbisPorcentaje', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Subtotal: RD$ {c.subtotal.toFixed(2)} · ITBIS: RD$ {c.itbisMonto.toFixed(2)} ·
                      Total: RD$ {c.total.toFixed(2)}
                    </p>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Agregar ítem
            </button>
          </div>

          <div className="mt-4 space-y-1 border-t border-slate-200 pt-4 text-right">
            <p className="text-sm text-slate-500">Subtotal: RD$ {totales.subtotal.toFixed(2)}</p>
            <p className="text-sm text-slate-500">ITBIS: RD$ {totales.itbis.toFixed(2)}</p>
            <p className="text-base font-bold text-slate-900">
              Total: RD$ {totales.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Opciones */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Opciones</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="validaHasta">Válida hasta</Label>
              <Input
                id="validaHasta"
                type="date"
                value={form.validaHasta}
                onChange={(e) => setField('validaHasta', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                value={form.notas}
                onChange={(e) => setField('notas', e.target.value)}
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Condiciones, notas adicionales..."
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear cotización'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
