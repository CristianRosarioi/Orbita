'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Proveedor {
  id: string;
  nombre: string;
}
interface ItemLocal {
  descripcion: string;
  unidadMedida: string;
  cantidad: string;
  precioUnitario: string;
}

const UNIDADES = [
  'und',
  'kg',
  'ton',
  'm²',
  'm³',
  'saco',
  'rollo',
  'galón',
  'cubo',
  'varilla',
  'caja',
  'bolsa',
];

export default function NuevoPedidoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const [form, setForm] = useState({
    proveedorId: '',
    fechaEntrega: '',
    notas: '',
  });

  const [items, setItems] = useState<ItemLocal[]>([
    { descripcion: '', unidadMedida: 'und', cantidad: '1', precioUnitario: '' },
  ]);

  useEffect(() => {
    fetch('/api/proveedores?limit=100')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProveedores(d.data ?? []);
      });
  }, []);

  function setField(f: string, v: string) {
    setForm((p) => ({ ...p, [f]: v }));
  }

  function setItem(i: number, f: keyof ItemLocal, v: string) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [f]: v } : item)));
  }

  function agregarItem() {
    setItems((prev) => [
      ...prev,
      { descripcion: '', unidadMedida: 'und', cantidad: '1', precioUnitario: '' },
    ]);
  }

  function eliminarItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((s, item) => {
    const cant = parseFloat(item.cantidad) || 0;
    const precio = parseFloat(item.precioUnitario) || 0;
    return s + cant * precio;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.proveedorId) {
      setError('Selecciona un proveedor.');
      return;
    }
    const itemsValidos = items.filter((i) => i.descripcion && parseFloat(i.precioUnitario) > 0);
    if (itemsValidos.length === 0) {
      setError('Agrega al menos un ítem válido.');
      return;
    }
    setLoading(true);
    try {
      // Crear pedido
      const resPedido = await fetch('/api/ferreteria/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedorId: form.proveedorId,
          fechaEntrega: form.fechaEntrega || undefined,
          notas: form.notas || undefined,
        }),
      });
      const dataPedido = await resPedido.json();
      if (!dataPedido.success) {
        setError(dataPedido.error?.message ?? 'Error al crear el pedido.');
        return;
      }

      const pedidoId = dataPedido.data.id;

      // Agregar ítems
      for (const item of itemsValidos) {
        await fetch(`/api/ferreteria/pedidos/${pedidoId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            descripcion: item.descripcion,
            unidadMedida: item.unidadMedida,
            cantidad: parseFloat(item.cantidad),
            precioUnitario: parseFloat(item.precioUnitario),
          }),
        });
      }

      router.push(`/ferreteria/pedidos/${pedidoId}`);
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nuevo pedido</h1>
        <p className="text-slate-500 text-sm mt-1">Crea un pedido de compra a un proveedor.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Proveedor y fecha */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Proveedor
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Proveedor *</Label>
              <Select
                value={form.proveedorId}
                onValueChange={(v) => setField('proveedorId', v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona proveedor..." />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaEntrega">Fecha de entrega esperada</Label>
              <Input
                id="fechaEntrega"
                type="date"
                value={form.fechaEntrega}
                onChange={(e) => setField('fechaEntrega', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas</Label>
            <textarea
              id="notas"
              value={form.notas}
              onChange={(e) => setField('notas', e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>
        </div>

        {/* Ítems */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Ítems del pedido
            </h2>
            <Button type="button" size="sm" variant="outline" onClick={agregarItem}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar ítem
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4 space-y-1">
                  {i === 0 && <Label className="text-xs">Descripción *</Label>}
                  <Input
                    value={item.descripcion}
                    onChange={(e) => setItem(i, 'descripcion', e.target.value)}
                    placeholder="Ej: Cemento Portland 94lb"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  {i === 0 && <Label className="text-xs">Unidad</Label>}
                  <Select
                    value={item.unidadMedida}
                    onValueChange={(v) => setItem(i, 'unidadMedida', v ?? 'und')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  {i === 0 && <Label className="text-xs">Cantidad</Label>}
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.cantidad}
                    onChange={(e) => setItem(i, 'cantidad', e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  {i === 0 && <Label className="text-xs">Precio unit.</Label>}
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.precioUnitario}
                    onChange={(e) => setItem(i, 'precioUnitario', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  {i === 0 && <Label className="text-xs">Subtotal</Label>}
                  <p className="text-sm font-medium text-slate-700 py-2">
                    {(
                      (parseFloat(item.cantidad) || 0) * (parseFloat(item.precioUnitario) || 0)
                    ).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="col-span-1 flex justify-end">
                  {i === 0 && <div className="h-5" />}
                  {items.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => eliminarItem(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-3">
            <div className="text-right">
              <p className="text-xs text-slate-500">Total estimado</p>
              <p className="text-xl font-bold text-slate-900">
                RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar borrador'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
