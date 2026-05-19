'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Transferencia {
  id: string;
  cantidad: number;
  estado: string;
  notas?: string | null;
  createdAt: string;
  sucursalOrigen: { nombre: string; codigo: string };
  sucursalDestino: { nombre: string; codigo: string };
  producto: { nombre: string; sku: string | null };
}

function TransferenciasLista() {
  const searchParams = useSearchParams();
  const sucursalId = searchParams.get('sucursalId');
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const qs = sucursalId ? `?sucursalId=${sucursalId}` : '';
    fetch(`/api/transferencias${qs}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setTransferencias(d.data); })
      .finally(() => setCargando(false));
  }, [sucursalId]);

  if (cargando) return <p className="text-muted-foreground text-sm">Cargando...</p>;

  if (transferencias.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <ArrowRightLeft className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground text-sm">No hay transferencias registradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transferencias.map((t) => (
        <Card key={t.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{t.sucursalOrigen.nombre}</span>
                <ArrowRightLeft className="text-muted-foreground h-3 w-3" />
                <span>{t.sucursalDestino.nombre}</span>
              </div>
              <p className="text-muted-foreground text-sm">
                {t.producto.nombre} — {Number(t.cantidad)} unidades
              </p>
              {t.notas && <p className="text-muted-foreground text-xs">{t.notas}</p>}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={t.estado === 'COMPLETADA' ? 'secondary' : 'outline'}>{t.estado}</Badge>
              <span className="text-muted-foreground text-xs">
                {new Date(t.createdAt).toLocaleDateString('es-DO')}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function TransferenciasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transferencias de inventario</h1>
          <p className="text-muted-foreground text-sm">Mueve stock entre sucursales</p>
        </div>
        <Link href="/transferencias/nueva" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva transferencia
        </Link>
      </div>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando...</p>}>
        <TransferenciasLista />
      </Suspense>
    </div>
  );
}
