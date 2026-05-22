'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Item {
  descripcion: string;
  cantidad: string;
  precioUnitario: string;
}

const CANALES = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'OTRO', label: 'Otro' },
];

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'TARJETA', label: 'Tarjeta' },
];

export default function NuevoPedidoOnlinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    canal: 'WHATSAPP',
    metodoPago: '',
    direccionEntrega: '',
    notas: '',
  });

  const [items, setItems] = useState<Item[]>([
    { descripcion: '', cantidad: '1', precioUnitario: '' },
  ]);

  function setF(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setItem(idx: number, field: keyof Item, value: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  function agregarItem() {
    setItems((prev) => [...prev, { descripcion: '', cantidad: '1', precioUnitario: '' }]);
  }

  function eliminarItem(idx: number) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((acc, it) => {
    const qty = parseInt(it.cantidad) || 0;
    const price = parseFloat(it.precioUnitario) || 0;
    return acc + qty * price;
  }, 0);
  const itbis = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + itbis;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const itemsValidos = items.filter(
      (it) => it.descripcion.trim() && parseInt(it.cantidad) > 0 && parseFloat(it.precioUnitario) > 0,
    );
    if (itemsValidos.length === 0) {
      setError('Agrega al menos un ítem válido.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/tienda-online/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: form.clienteNombre,
          clienteTelefono: form.clienteTelefono || undefined,
          canal: form.canal,
          metodoPago: form.metodoPago || undefined,
          direccionEntrega: form.direccionEntrega || undefined,
          notas: form.notas || undefined,
          items: itemsValidos.map((it) => ({
            descripcion: it.descripcion,
            cantidad: parseInt(it.cantidad),
            precioUnitario: parseFloat(it.precioUnitario),
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al crear el pedido.');
        return;
      }
      router.push(`/tienda-online/pedidos/${data.data.id}`);
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
          <ShoppingBag className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nuevo pedido online</h1>
          <p className="text-sm text-slate-500">Registra un pedido recibido por WhatsApp, Instagram u otro canal</p>
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
                onChange={(e) => setF('clienteNombre', e.target.value)}
                placeholder="Nombre del cliente"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clienteTelefono">Teléfono</Label>
              <Input
                id="clienteTelefono"
                value={form.clienteTelefono}
                onChange={(e) => setF('clienteTelefono', e.target.value)}
                placeholder="809-000-0000"
              />
            </div>
          </div>
        </div>

        {/* Canal y dirección */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Canal y entrega</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Canal de pedido</Label>
              <div className="flex flex-wrap gap-2">
                {CANALES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setF('canal', c.value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      form.canal === c.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <div className="flex flex-wrap gap-2">
                {METODOS_PAGO.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setF('metodoPago', form.metodoPago === m.value ? '' : m.value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      form.metodoPago === m.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="direccionEntrega">Dirección de entrega</Label>
              <Input
                id="direccionEntrega"
                value={form.direccionEntrega}
                onChange={(e) => setF('direccionEntrega', e.target.value)}
                placeholder="Calle, sector, ciudad..."
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                value={form.notas}
                onChange={(e) => setF('notas', e.target.value)}
                rows={2}
                placeholder="Instrucciones especiales..."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Ítems */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Ítems del pedido</h2>
            <Button type="button" size="sm" variant="outline" onClick={agregarItem} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Agregar ítem
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 grid gap-2 sm:grid-cols-5">
                  <div className="sm:col-span-3">
                    <Input
                      placeholder="Descripción del producto *"
                      value={item.descripcion}
                      onChange={(e) => setItem(idx, 'descripcion', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={item.cantidad}
                      onChange={(e) => setItem(idx, 'cantidad', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Precio"
                      value={item.precioUnitario}
                      onChange={(e) => setItem(idx, 'precioUnitario', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => eliminarItem(idx)}
                  disabled={items.length === 1}
                  className="mt-0.5 rounded p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Totales en vivo */}
          <div className="mt-5 border-t border-slate-100 pt-4 space-y-1">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>RD$ {subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>ITBIS (18%)</span>
              <span>RD$ {itbis.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900">
              <span>Total</span>
              <span>RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Crear pedido'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
