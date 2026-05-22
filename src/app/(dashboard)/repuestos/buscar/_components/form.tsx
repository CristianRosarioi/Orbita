'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface Props {
  defaultValues: { marca: string; modelo: string; anio: string; q: string };
}

export function BuscarRepuestosForm({ defaultValues }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(defaultValues);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (form.marca) params.set('marca', form.marca);
    if (form.modelo) params.set('modelo', form.modelo);
    if (form.anio) params.set('anio', form.anio);
    if (form.q) params.set('q', form.q);
    router.push(`/repuestos/buscar?${params.toString()}`);
  }

  function handleClear() {
    setForm({ marca: '', modelo: '', anio: '', q: '' });
    router.push('/repuestos/buscar');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="marca">Marca del vehículo</Label>
          <Input
            id="marca"
            value={form.marca}
            onChange={(e) => set('marca', e.target.value)}
            placeholder="Toyota, Honda..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modelo">Modelo</Label>
          <Input
            id="modelo"
            value={form.modelo}
            onChange={(e) => set('modelo', e.target.value)}
            placeholder="Corolla, Civic..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="anio">Año</Label>
          <Input
            id="anio"
            type="number"
            min="1900"
            max="2100"
            value={form.anio}
            onChange={(e) => set('anio', e.target.value)}
            placeholder="2020"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="q">Código o nombre</Label>
          <Input
            id="q"
            value={form.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Filtro de aceite..."
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" className="gap-2">
          <Search className="h-4 w-4" />
          Buscar
        </Button>
        {(form.marca || form.modelo || form.anio || form.q) && (
          <Button type="button" variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
        )}
      </div>
    </form>
  );
}
