'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Sucursal { id: string; nombre: string; codigo: string }
interface Producto { id: string; nombre: string; sku: string | null }

function NuevaTransferenciaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origenDefault = searchParams.get('origen') ?? '';

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/sucursales').then((r) => r.json()),
      fetch('/api/productos').then((r) => r.json()),
    ]).then(([s, p]) => {
      if (s.success) setSucursales(s.data);
      if (p.success) setProductos(p.data);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGuardando(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      sucursalOrigenId: fd.get('sucursalOrigenId'),
      sucursalDestinoId: fd.get('sucursalDestinoId'),
      productoId: fd.get('productoId'),
      cantidad: Number(fd.get('cantidad')),
      notas: fd.get('notas') || undefined,
    };

    const res = await fetch('/api/transferencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setGuardando(false);

    if (data.success) {
      router.push('/transferencias');
    } else {
      setError(data.error?.message ?? 'Error al registrar la transferencia.');
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/transferencias" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Nueva transferencia</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la transferencia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="sucursalOrigenId">Sucursal origen *</Label>
              <select
                id="sucursalOrigenId"
                name="sucursalOrigenId"
                defaultValue={origenDefault}
                required
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Selecciona la sucursal origen</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre} ({s.codigo})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="sucursalDestinoId">Sucursal destino *</Label>
              <select
                id="sucursalDestinoId"
                name="sucursalDestinoId"
                required
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Selecciona la sucursal destino</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre} ({s.codigo})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="productoId">Producto *</Label>
              <select
                id="productoId"
                name="productoId"
                required
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Selecciona un producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}{p.sku ? ` (${p.sku})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cantidad">Cantidad *</Label>
              <Input id="cantidad" name="cantidad" type="number" min={0.01} step={0.01} required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notas">Notas</Label>
              <Input id="notas" name="notas" placeholder="Motivo de la transferencia..." />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/transferencias" className={buttonVariants({ variant: 'outline' })}>
                Cancelar
              </Link>
              <Button type="submit" disabled={guardando}>
                {guardando ? 'Transfiriendo...' : 'Ejecutar transferencia'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NuevaTransferenciaPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando...</p>}>
      <NuevaTransferenciaForm />
    </Suspense>
  );
}
