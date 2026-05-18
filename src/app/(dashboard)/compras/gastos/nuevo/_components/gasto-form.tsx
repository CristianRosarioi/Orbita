'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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

const CATEGORIAS = [
  { value: 'ALQUILER', label: 'Alquiler' },
  { value: 'SERVICIOS_PUBLICOS', label: 'Servicios públicos' },
  { value: 'NOMINA', label: 'Nómina' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'EQUIPOS', label: 'Equipos' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'COMUNICACIONES', label: 'Comunicaciones' },
  { value: 'SEGUROS', label: 'Seguros' },
  { value: 'IMPUESTOS', label: 'Impuestos' },
  { value: 'OTROS', label: 'Otros' },
];

export function GastoForm({ proveedores }: { proveedores: Proveedor[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [itbis, setItbis] = useState('0');
  const [categoria, setCategoria] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [fechaGasto, setFechaGasto] = useState(hoy);
  const [comprobante, setComprobante] = useState('');
  const [ncfProveedor, setNcfProveedor] = useState('');
  const [notas, setNotas] = useState('');

  const montoNum = parseFloat(monto) || 0;
  const itbisNum = parseFloat(itbis) || 0;
  const total = Math.round((montoNum + itbisNum) * 100) / 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim()) {
      toast.error('La descripción es requerida');
      return;
    }
    if (montoNum <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    if (!fechaGasto) {
      toast.error('La fecha es requerida');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/compras/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: descripcion.trim(),
          monto: montoNum,
          itbis: itbisNum,
          categoria: categoria || undefined,
          proveedorId: proveedorId || undefined,
          fechaGasto,
          comprobante: comprobante.trim() || undefined,
          ncfProveedor: ncfProveedor.trim() || undefined,
          notas: notas.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al registrar el gasto');
        return;
      }
      toast.success('Gasto registrado');
      router.push('/compras/gastos');
      router.refresh();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos principales */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Información del gasto</h2>

        <div className="space-y-1.5">
          <Label htmlFor="descripcion">Descripción *</Label>
          <Input
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Pago de renta local comercial enero 2025"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="monto">Monto (sin ITBIS) *</Label>
            <Input
              id="monto"
              type="number"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="itbis">ITBIS</Label>
            <Input
              id="itbis"
              type="number"
              min="0"
              step="0.01"
              value={itbis}
              onChange={(e) => setItbis(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Total</Label>
            <div className="flex items-center h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900">
              RD$ {total.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="categoria">Categoría</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v ?? '')}>
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fechaGasto">Fecha del gasto *</Label>
            <Input
              id="fechaGasto"
              type="date"
              value={fechaGasto}
              onChange={(e) => setFechaGasto(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Proveedor y comprobante */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Proveedor y comprobante fiscal</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="proveedor">Proveedor</Label>
            <Select value={proveedorId} onValueChange={(v) => setProveedorId(v ?? '')}>
              <SelectTrigger id="proveedor">
                <SelectValue placeholder="Sin proveedor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin proveedor</SelectItem>
                {proveedores.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombreComercial ?? p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ncfProveedor">NCF del proveedor</Label>
            <Input
              id="ncfProveedor"
              value={ncfProveedor}
              onChange={(e) => setNcfProveedor(e.target.value.toUpperCase())}
              placeholder="B0100000001"
              maxLength={19}
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="comprobante">Número de comprobante / referencia</Label>
          <Input
            id="comprobante"
            value={comprobante}
            onChange={(e) => setComprobante(e.target.value)}
            placeholder="Número de factura o recibo"
          />
        </div>
      </div>

      {/* Notas */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-1.5">
        <Label htmlFor="notas">Notas internas</Label>
        <Textarea
          id="notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Observaciones adicionales..."
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
          Registrar gasto
        </Button>
      </div>
    </form>
  );
}
