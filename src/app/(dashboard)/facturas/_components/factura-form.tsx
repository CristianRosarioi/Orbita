'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuscarClienteInput } from '@/components/shared/buscar-cliente-input';
import { ItemsFacturaTable, type ItemRow } from '@/components/shared/items-factura-table';
import { toast } from 'sonner';
import { MetodoPago } from '@/types/enums';

const METODOS_PAGO = [
  { value: MetodoPago.EFECTIVO, label: 'Efectivo' },
  { value: MetodoPago.TARJETA, label: 'Tarjeta' },
  { value: MetodoPago.TRANSFERENCIA, label: 'Transferencia' },
  { value: MetodoPago.CHEQUE, label: 'Cheque' },
  { value: MetodoPago.CREDITO, label: 'Crédito' },
];

export function FacturaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Client section
  const [clienteId, setClienteId] = useState<string | undefined>();
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [clienteIdentificacion, setClienteIdentificacion] = useState('');

  // Items
  const [items, setItems] = useState<ItemRow[]>([]);

  // Payment section
  const [metodoPago, setMetodoPago] = useState<string>(MetodoPago.EFECTIVO);
  const [descuento, setDescuento] = useState<string>('0');
  const [notas, setNotas] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  function calcTotales() {
    let subtotal = 0;
    let itbis = 0;
    for (const item of items) {
      const sub = Math.round(item.cantidad * item.precioUnitario * 100) / 100;
      const itbisMonto = Math.round(sub * (item.itbisPorcentaje / 100) * 100) / 100;
      subtotal += sub;
      itbis += itbisMonto;
    }
    const desc = parseFloat(descuento) || 0;
    const total = Math.round((subtotal + itbis - desc) * 100) / 100;
    return { subtotal, itbis, descuento: desc, total };
  }

  function buildPayload() {
    return {
      clienteId: clienteId || undefined,
      clienteNombre: clienteNombre || 'Consumidor Final',
      clienteIdentificacion: clienteIdentificacion || undefined,
      metodoPago,
      items: items.map((item) => ({
        productoId: item.productoId,
        productoNombre: item.productoNombre,
        productoSku: item.productoSku,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        itbisPorcentaje: item.itbisPorcentaje,
        descuento: item.descuento,
      })),
      descuento: parseFloat(descuento) || 0,
      notas: notas || undefined,
      fechaVencimiento: fechaVencimiento || undefined,
    };
  }

  function validate() {
    if (items.length === 0) {
      toast.error('Debes agregar al menos un producto o servicio.');
      return false;
    }
    for (const item of items) {
      if (!item.productoNombre.trim()) {
        toast.error('Todos los items deben tener un nombre.');
        return false;
      }
      if (item.cantidad <= 0) {
        toast.error('La cantidad de cada item debe ser mayor a 0.');
        return false;
      }
    }
    if (metodoPago === MetodoPago.CREDITO && !fechaVencimiento) {
      toast.error('Para crédito debes indicar la fecha de vencimiento.');
      return false;
    }
    return true;
  }

  async function handleGuardarBorrador() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al guardar la factura.');
        return;
      }
      toast.success('Factura guardada como borrador.');
      router.push(`/facturas/${json.data.id}`);
    } catch {
      toast.error('Ocurrió un error al guardar la factura.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmitir() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al crear la factura.');
        return;
      }

      const facturaId = json.data.id;

      const emitRes = await fetch(`/api/facturas/${facturaId}/emitir`, {
        method: 'POST',
      });
      const emitJson = await emitRes.json();
      if (!emitRes.ok || !emitJson.success) {
        toast.error(emitJson.error?.message ?? 'Error al emitir la factura.');
        router.push(`/facturas/${facturaId}`);
        return;
      }

      toast.success('Factura emitida correctamente.');
      router.push(`/facturas/${facturaId}`);
    } catch {
      toast.error('Ocurrió un error al emitir la factura.');
    } finally {
      setLoading(false);
    }
  }

  const totales = calcTotales();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Sección 1: Cliente */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Información del cliente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Buscar cliente existente</Label>
            <BuscarClienteInput
              placeholder="Escribir nombre o cédula..."
              onSelect={(c) => {
                setClienteId(c.id);
                setClienteNombre(c.nombre);
                if (c.identificacion) setClienteIdentificacion(c.identificacion);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cliente-nombre">Nombre en factura</Label>
            <Input
              id="cliente-nombre"
              value={clienteNombre}
              onChange={(e) => {
                setClienteNombre(e.target.value);
                setClienteId(undefined);
              }}
              placeholder="Consumidor Final"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cliente-identificacion">Identificación (opcional)</Label>
            <Input
              id="cliente-identificacion"
              value={clienteIdentificacion}
              onChange={(e) => setClienteIdentificacion(e.target.value)}
              placeholder="Cédula, RNC o pasaporte"
            />
          </div>
        </div>
      </Card>

      {/* Sección 2: Items */}
      <Card className="p-5">
        <ItemsFacturaTable items={items} onChange={setItems} />
      </Card>

      {/* Sección 3: Pago y totales */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Condiciones de pago</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="metodo-pago">Método de pago</Label>
            <Select
              value={metodoPago}
              onValueChange={(v) => setMetodoPago(v ?? MetodoPago.EFECTIVO)}
            >
              <SelectTrigger id="metodo-pago" className="w-full">
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                {METODOS_PAGO.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descuento-global">Descuento global (RD$)</Label>
            <Input
              id="descuento-global"
              type="number"
              min="0"
              step="0.01"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
            />
          </div>
          {metodoPago === MetodoPago.CREDITO && (
            <div className="space-y-1.5">
              <Label htmlFor="fecha-vencimiento">Fecha de vencimiento *</Label>
              <Input
                id="fecha-vencimiento"
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notas-factura">Notas (opcional)</Label>
            <Textarea
              id="notas-factura"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Condiciones especiales, referencias, etc."
              rows={2}
            />
          </div>
        </div>

        <Separator />

        {/* Resumen totales */}
        <div className="flex justify-end">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>RD$ {totales.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ITBIS (18%)</span>
              <span>RD$ {totales.itbis.toFixed(2)}</span>
            </div>
            {totales.descuento > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuento</span>
                <span>- RD$ {totales.descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-2">
              <span>Total</span>
              <span>RD$ {totales.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Acciones */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={handleGuardarBorrador} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar borrador'}
        </Button>
        <Button type="button" onClick={handleEmitir} disabled={loading}>
          {loading ? 'Emitiendo...' : 'Emitir factura'}
        </Button>
      </div>
    </div>
  );
}
