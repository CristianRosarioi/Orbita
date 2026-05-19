'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NuevaSucursalPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGuardando(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      nombre: fd.get('nombre'),
      codigo: fd.get('codigo'),
      ciudad: fd.get('ciudad') || undefined,
      telefono: fd.get('telefono') || undefined,
      encargado: fd.get('encargado') || undefined,
      direccion: fd.get('direccion') || undefined,
    };

    const res = await fetch('/api/sucursales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setGuardando(false);

    if (data.success) {
      router.push(`/sucursales/${data.data.id}`);
    } else {
      setError(data.error?.message ?? 'Error al crear la sucursal.');
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/sucursales" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Nueva sucursal</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de la sucursal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" name="nombre" placeholder="Sucursal Centro" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="codigo">Código *</Label>
                <Input id="codigo" name="codigo" placeholder="SC01" maxLength={10} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input id="ciudad" name="ciudad" placeholder="Santo Domingo" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" placeholder="809-000-0000" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="encargado">Encargado</Label>
              <Input id="encargado" name="encargado" placeholder="Nombre del encargado" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" placeholder="Av. Principal #123" />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/sucursales" className={buttonVariants({ variant: 'outline' })}>
                Cancelar
              </Link>
              <Button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Crear sucursal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
