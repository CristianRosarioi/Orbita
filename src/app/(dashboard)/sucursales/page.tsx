'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, MapPin, Phone, User } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Sucursal {
  id: string;
  nombre: string;
  codigo: string;
  ciudad?: string | null;
  telefono?: string | null;
  encargado?: string | null;
  esPrincipal: boolean;
  activa: boolean;
}

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('/api/sucursales')
      .then((r) => r.json())
      .then((d) => { if (d.success) setSucursales(d.data); })
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sucursales</h1>
          <p className="text-muted-foreground text-sm">Gestiona las sedes de tu empresa</p>
        </div>
        <Link href="/sucursales/nueva" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva sucursal
        </Link>
      </div>

      {cargando ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : sucursales.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Building2 className="text-muted-foreground h-10 w-10" />
            <p className="text-muted-foreground text-sm">No hay sucursales registradas</p>
            <Link href="/sucursales/nueva" className={buttonVariants({ variant: 'outline' })}>
              Crear primera sucursal
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sucursales.map((s) => (
            <Link key={s.id} href={`/sucursales/${s.id}`} className="block">
              <Card className="hover:border-primary transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{s.nombre}</CardTitle>
                    <div className="flex gap-1">
                      {s.esPrincipal && <Badge variant="secondary">Principal</Badge>}
                      {!s.activa && <Badge variant="destructive">Inactiva</Badge>}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs font-mono">{s.codigo}</p>
                </CardHeader>
                <CardContent className="space-y-1">
                  {s.ciudad && (
                    <p className="text-muted-foreground flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" /> {s.ciudad}
                    </p>
                  )}
                  {s.telefono && (
                    <p className="text-muted-foreground flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" /> {s.telefono}
                    </p>
                  )}
                  {s.encargado && (
                    <p className="text-muted-foreground flex items-center gap-1 text-sm">
                      <User className="h-3 w-3" /> {s.encargado}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
