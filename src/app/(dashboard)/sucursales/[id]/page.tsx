'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Package, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StockItem {
  id: string;
  cantidad: number;
  bajoMinimo: boolean;
  producto: { id: string; nombre: string; sku: string | null; stockMinimo: number };
}

interface Reporte {
  totalVentas: number;
  cantidadFacturas: number;
  transferenciasEnviadas: number;
  transferenciasRecibidas: number;
  productosEnStock: number;
  unidadesEnStock: number;
}

interface Sucursal {
  id: string;
  nombre: string;
  codigo: string;
  ciudad?: string | null;
  telefono?: string | null;
  encargado?: string | null;
  direccion?: string | null;
  esPrincipal: boolean;
  activa: boolean;
}

export default function DetalleSucursalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/sucursales/${id}`).then((r) => r.json()),
      fetch(`/api/sucursales/${id}/stock`).then((r) => r.json()),
      fetch(`/api/sucursales/${id}/reporte`).then((r) => r.json()),
    ]).then(([s, st, rp]) => {
      if (s.success) setSucursal(s.data);
      if (st.success) setStock(st.data);
      if (rp.success) setReporte(rp.data.reporte);
      setCargando(false);
    });
  }, [id]);

  async function handleDesactivar() {
    if (!confirm('¿Seguro que deseas desactivar esta sucursal?')) return;
    const res = await fetch(`/api/sucursales/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) router.push('/sucursales');
  }

  if (cargando) return <p className="text-muted-foreground text-sm">Cargando...</p>;
  if (!sucursal) return <p className="text-destructive text-sm">Sucursal no encontrada.</p>;

  const itemsBajoMinimo = stock.filter((s) => s.bajoMinimo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/sucursales" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{sucursal.nombre}</h1>
              {sucursal.esPrincipal && <Badge variant="secondary">Principal</Badge>}
              {!sucursal.activa && <Badge variant="destructive">Inactiva</Badge>}
            </div>
            <p className="text-muted-foreground text-sm font-mono">{sucursal.codigo}</p>
          </div>
        </div>
        {!sucursal.esPrincipal && sucursal.activa && (
          <button
            onClick={handleDesactivar}
            className={buttonVariants({ variant: 'outline' })}
          >
            Desactivar
          </button>
        )}
      </div>

      {reporte && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Ventas totales</p>
              <p className="text-2xl font-bold">
                RD$ {Number(reporte.totalVentas).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-muted-foreground text-xs">{reporte.cantidadFacturas} facturas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Transferencias</p>
              <p className="text-2xl font-bold">{reporte.transferenciasEnviadas + reporte.transferenciasRecibidas}</p>
              <p className="text-muted-foreground text-xs">
                {reporte.transferenciasEnviadas} enviadas · {reporte.transferenciasRecibidas} recibidas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Stock en sucursal</p>
              <p className="text-2xl font-bold">{reporte.productosEnStock} productos</p>
              <p className="text-muted-foreground text-xs">{Number(reporte.unidadesEnStock).toLocaleString()} unidades</p>
            </CardContent>
          </Card>
        </div>
      )}

      {itemsBajoMinimo.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              {itemsBajoMinimo.length} producto(s) bajo el mínimo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {itemsBajoMinimo.map((s) => (
                <li key={s.id} className="text-sm text-amber-700 dark:text-amber-300">
                  {s.producto.nombre} — {Number(s.cantidad)} unidades (mín. {Number(s.producto.stockMinimo)})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link href={`/transferencias/nueva?origen=${id}`} className={buttonVariants({ variant: 'outline' })}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Nueva transferencia
        </Link>
        <Link href={`/transferencias?sucursalId=${id}`} className={buttonVariants({ variant: 'ghost' })}>
          Ver transferencias
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Inventario en esta sucursal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stock.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin stock registrado en esta sucursal.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium">SKU</th>
                    <th className="pb-2 text-right font-medium">Cantidad</th>
                    <th className="pb-2 text-right font-medium">Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2">
                        {s.producto.nombre}
                        {s.bajoMinimo && (
                          <AlertTriangle className="ml-1 inline h-3 w-3 text-amber-500" />
                        )}
                      </td>
                      <td className="text-muted-foreground py-2 font-mono text-xs">{s.producto.sku ?? '—'}</td>
                      <td className="py-2 text-right font-medium">{Number(s.cantidad)}</td>
                      <td className="text-muted-foreground py-2 text-right">{Number(s.producto.stockMinimo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Datos de la sucursal
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          {sucursal.ciudad && <div><span className="text-muted-foreground">Ciudad:</span> {sucursal.ciudad}</div>}
          {sucursal.telefono && <div><span className="text-muted-foreground">Teléfono:</span> {sucursal.telefono}</div>}
          {sucursal.encargado && <div><span className="text-muted-foreground">Encargado:</span> {sucursal.encargado}</div>}
          {sucursal.direccion && <div className="sm:col-span-2"><span className="text-muted-foreground">Dirección:</span> {sucursal.direccion}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
