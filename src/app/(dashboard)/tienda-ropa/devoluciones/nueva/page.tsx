'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NuevaDevolucionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    facturaNumero: '',
    facturaId: '',
    motivo: '',
    tipo: 'DEVOLUCION',
    montoCredito: '',
    notas: '',
  });

  const [buscandoFactura, setBuscandoFactura] = useState(false);
  const [facturaEncontrada, setFacturaEncontrada] = useState<{
    id: string;
    numero: string;
    total: number;
    clienteNombre: string;
  } | null>(null);

  function setF(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function buscarFactura() {
    if (!form.facturaNumero.trim()) return;
    setBuscandoFactura(true);
    setFacturaEncontrada(null);
    try {
      const res = await fetch(`/api/facturas?q=${encodeURIComponent(form.facturaNumero)}&limit=1`);
      const data = await res.json();
      const facturas = data.data?.data ?? data.data ?? [];
      if (facturas.length > 0) {
        const f = facturas[0];
        setFacturaEncontrada({ id: f.id, numero: f.numero, total: Number(f.total), clienteNombre: f.clienteNombre });
        setF('facturaId', f.id);
      } else {
        setError('Factura no encontrada. Verifica el número.');
      }
    } catch {
      setError('Error al buscar la factura.');
    } finally {
      setBuscandoFactura(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.facturaId) {
      setError('Primero busca y selecciona una factura.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/tienda-ropa/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facturaId: form.facturaId,
          motivo: form.motivo,
          tipo: form.tipo,
          montoCredito: form.montoCredito ? parseFloat(form.montoCredito) : undefined,
          notas: form.notas || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al registrar la devolución.');
        return;
      }
      router.push('/tienda-ropa/devoluciones');
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
          <RotateCcw className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nueva devolución</h1>
          <p className="text-sm text-slate-500">Registra una devolución o intercambio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Buscar factura */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Factura original</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Número de factura (ej: FAC-0001)"
              value={form.facturaNumero}
              onChange={(e) => {
                setF('facturaNumero', e.target.value);
                setFacturaEncontrada(null);
                setF('facturaId', '');
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={buscarFactura}
              disabled={buscandoFactura}
            >
              {buscandoFactura ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
          {facturaEncontrada && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <strong>{facturaEncontrada.numero}</strong> — {facturaEncontrada.clienteNombre} —
              RD$ {facturaEncontrada.total.toLocaleString('es-DO')}
            </div>
          )}
        </div>

        {/* Detalles devolución */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Detalles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <div className="flex gap-3">
                {['DEVOLUCION', 'INTERCAMBIO'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setF('tipo', t)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      form.tipo === t
                        ? 'border-pink-600 bg-pink-50 text-pink-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {t === 'DEVOLUCION' ? 'Devolución' : 'Intercambio'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="motivo">Motivo *</Label>
              <textarea
                id="motivo"
                value={form.motivo}
                onChange={(e) => setF('motivo', e.target.value)}
                rows={3}
                required
                placeholder="Describe el motivo de la devolución..."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="montoCredito">Monto de crédito (RD$)</Label>
              <Input
                id="montoCredito"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.montoCredito}
                onChange={(e) => setF('montoCredito', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notas">Notas adicionales</Label>
              <textarea
                id="notas"
                value={form.notas}
                onChange={(e) => setF('notas', e.target.value)}
                rows={2}
                placeholder="Observaciones..."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar devolución'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
