'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

export default function AgregarItem({ ordenId }: { ordenId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    tipo: 'SERVICIO',
    descripcion: '',
    cantidad: '1',
    precioUnitario: '',
    itbisPorcentaje: '18',
  });

  function set(f: string, v: string) {
    setForm((p) => ({ ...p, [f]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/taller/ordenes/${ordenId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: form.tipo,
          descripcion: form.descripcion,
          cantidad: parseFloat(form.cantidad),
          precioUnitario: parseFloat(form.precioUnitario),
          itbisPorcentaje: parseFloat(form.itbisPorcentaje),
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message ?? 'Error.'); return; }
      setOpen(false);
      setForm({ tipo: 'SERVICIO', descripcion: '', cantidad: '1', precioUnitario: '', itbisPorcentaje: '18' });
      router.refresh();
    } catch { setError('Error de conexión.'); }
    finally { setLoading(false); }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Agregar ítem
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 space-y-4">
            <h3 className="font-semibold text-slate-900">Agregar servicio o repuesto</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <select
                  value={form.tipo}
                  onChange={(e) => set('tipo', e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="SERVICIO">Servicio</option>
                  <option value="REPUESTO">Repuesto</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Descripción *</Label>
                <Input id="desc" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cant">Cantidad</Label>
                  <Input id="cant" type="number" min="0.01" step="0.01" value={form.cantidad} onChange={(e) => set('cantidad', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="precio">Precio unit.</Label>
                  <Input id="precio" type="number" min="0.01" step="0.01" value={form.precioUnitario} onChange={(e) => set('precioUnitario', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="itbis">ITBIS %</Label>
                  <Input id="itbis" type="number" min="0" max="100" value={form.itbisPorcentaje} onChange={(e) => set('itbisPorcentaje', e.target.value)} />
                </div>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2 pt-2">
                <Button type="submit" size="sm" disabled={loading} className="flex-1">
                  {loading ? 'Agregando...' : 'Agregar'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
