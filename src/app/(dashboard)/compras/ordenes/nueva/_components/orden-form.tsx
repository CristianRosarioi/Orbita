'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Proveedor {
  id: string;
  nombre: string;
  nombreComercial: string | null;
}

interface ItemRow {
  id: string;
  descripcion: string;
  cantidad: number;
  costoUnitario: number;
  itbisPorcentaje: number;
}

function calcTotales(items: ItemRow[]) {
  let subtotal = 0;
  let itbis = 0;
  for (const item of items) {
    const sub = Math.round(item.cantidad * item.costoUnitario * 100) / 100;
    const itbisMonto = Math.round(sub * (item.itbisPorcentaje / 100) * 100) / 100;
    subtotal += sub;
    itbis += itbisMonto;
  }
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    itbis: Math.round(itbis * 100) / 100,
    total: Math.round((subtotal + itbis) * 100) / 100,
  };
}

function newItem(): ItemRow {
  return {
    id: crypto.randomUUID(),
    descripcion: '',
    cantidad: 1,
    costoUnitario: 0,
    itbisPorcentaje: 0,
  };
}

export function OrdenForm({ proveedores }: { proveedores: Proveedor[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [proveedorId, setProveedorId] = useState('');
  const [items, setItems] = useState<ItemRow[]>([newItem()]);
  const [notas, setNotas] = useState('');
  const [fechaEsperada, setFechaEsperada] = useState('');

  const totales = calcTotales(items);

  function updateItem(id: string, field: keyof ItemRow, value: string | number) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function removeItem(id: string) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proveedorId) {
      toast.error('Selecciona un proveedor');
      return;
    }
    const itemsInvalidos = items.filter((i) => !i.descripcion.trim() || i.cantidad <= 0);
    if (itemsInvalidos.length > 0) {
      toast.error('Todos los ítems deben tener descripción y cantidad válida');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/compras/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedorId,
          items: items.map((i) => ({
            descripcion: i.descripcion,
            cantidad: i.cantidad,
            costoUnitario: i.costoUnitario,
            itbisPorcentaje: i.itbisPorcentaje,
          })),
          notas: notas || undefined,
          fechaEsperada: fechaEsperada || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al crear la orden');
        return;
      }
      toast.success('Orden creada en borrador');
      router.push(`/compras/ordenes/${json.data.id}`);
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Proveedor y fecha */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Información general</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="proveedor">Proveedor *</Label>
            <Select value={proveedorId} onValueChange={(v) => setProveedorId(v ?? '')}>
              <SelectTrigger id="proveedor">
                <SelectValue placeholder="Selecciona un proveedor" />
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombreComercial ?? p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fechaEsperada">Fecha esperada de entrega</Label>
            <Input
              id="fechaEsperada"
              type="date"
              value={fechaEsperada}
              onChange={(e) => setFechaEsperada(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Ítems */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Ítems</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems((prev) => [...prev, newItem()])}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar ítem
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left w-full">Descripción</th>
                <th className="px-4 py-2 text-right whitespace-nowrap">Cant.</th>
                <th className="px-4 py-2 text-right whitespace-nowrap">Costo unit.</th>
                <th className="px-4 py-2 text-right whitespace-nowrap">ITBIS %</th>
                <th className="px-4 py-2 text-right whitespace-nowrap">Subtotal</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const sub = Math.round(item.cantidad * item.costoUnitario * 100) / 100;
                const itbisM = Math.round(sub * (item.itbisPorcentaje / 100) * 100) / 100;
                const tot = sub + itbisM;
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      <Input
                        value={item.descripcion}
                        onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)}
                        placeholder="Descripción del producto o servicio"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.cantidad}
                        onChange={(e) =>
                          updateItem(item.id, 'cantidad', parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-sm text-right w-20"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.costoUnitario}
                        onChange={(e) =>
                          updateItem(item.id, 'costoUnitario', parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-sm text-right w-28"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Select
                        value={String(item.itbisPorcentaje)}
                        onValueChange={(v) =>
                          updateItem(item.id, 'itbisPorcentaje', parseFloat(v ?? '0'))
                        }
                      >
                        <SelectTrigger className="h-8 text-sm w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="16">16%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2 text-right text-slate-700 font-medium whitespace-nowrap">
                      RD$ {tot.toFixed(2)}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 flex justify-end">
          <div className="space-y-1 text-sm min-w-48">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>RD$ {totales.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ITBIS</span>
              <span>RD$ {totales.itbis.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-1 mt-1">
              <span>Total</span>
              <span>RD$ {totales.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-1.5">
        <Label htmlFor="notas">Notas internas</Label>
        <Textarea
          id="notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Instrucciones especiales, condiciones de entrega..."
          rows={3}
        />
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar borrador
        </Button>
      </div>
    </form>
  );
}
