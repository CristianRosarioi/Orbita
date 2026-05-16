'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

interface LineaAsiento {
  id: string;
  tipo: 'DEBITO' | 'CREDITO';
  monto: string;
  descripcion: string | null;
  cuenta: { codigo: string; nombre: string };
}

interface Asiento {
  id: string;
  numero: number;
  descripcion: string;
  fecha: string;
  lineas: LineaAsiento[];
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(n);
}

export default function AsientosPage() {
  const [asientos, setAsientos] = useState<Asiento[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      const res = await fetch(`/api/contabilidad/asientos?${params}`);
      const d = await res.json();
      if (!cancelled && d.success) {
        setAsientos(d.data.items);
        setTotal(d.data.total ?? 0);
        setTotalPages(d.data.totalPages ?? 1);
        setCargando(false);
      }
    }
    cargar();
    return () => { cancelled = true; };
  }, [page, desde, hasta]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-slate-700" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Libro Diario</h1>
          <p className="text-slate-500 text-sm mt-0.5">Asientos contables de doble partida</p>
        </div>
        <Badge variant="secondary" className="ml-auto">{total} asientos</Badge>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 flex gap-3 items-end flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Desde</label>
            <Input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPage(1); }} className="w-40" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Hasta</label>
            <Input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPage(1); }} className="w-40" />
          </div>
          {(desde || hasta) && (
            <Button variant="ghost" size="sm" onClick={() => { setDesde(''); setHasta(''); setPage(1); }}>
              Limpiar
            </Button>
          )}
        </CardContent>
      </Card>

      {cargando ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-slate-500 text-sm">Cargando asientos...</p>
        </div>
      ) : asientos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No hay asientos contables todavía.</p>
            <p className="text-slate-400 text-xs mt-1">Se crean automáticamente al emitir y cobrar facturas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {asientos.map((asiento) => {
            const totalDebitos  = asiento.lineas.filter((l) => l.tipo === 'DEBITO').reduce((s, l) => s + Number(l.monto), 0);
            const totalCreditos = asiento.lineas.filter((l) => l.tipo === 'CREDITO').reduce((s, l) => s + Number(l.monto), 0);
            const cuadrado = Math.abs(totalDebitos - totalCreditos) < 0.01;
            return (
              <Card key={asiento.id}>
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <CardTitle className="text-sm font-semibold flex-1">
                    <span className="font-mono text-slate-400 mr-2">#{asiento.numero}</span>
                    {asiento.descripcion}
                  </CardTitle>
                  <span className="text-xs text-slate-400">
                    {new Date(asiento.fecha).toLocaleDateString('es-DO')}
                  </span>
                  <Badge variant={cuadrado ? 'default' : 'destructive'} className="text-xs">
                    {cuadrado ? 'Cuadrado' : 'Desbalance'}
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left px-4 py-1.5 text-slate-500 font-medium">Cuenta</th>
                        <th className="text-left px-4 py-1.5 text-slate-500 font-medium">Descripción</th>
                        <th className="text-right px-4 py-1.5 text-slate-500 font-medium w-32">Débito</th>
                        <th className="text-right px-4 py-1.5 text-slate-500 font-medium w-32">Crédito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asiento.lineas.map((l) => (
                        <tr key={l.id} className="border-b last:border-0">
                          <td className="px-4 py-1.5 font-mono text-slate-500">
                            {l.cuenta.codigo} — {l.cuenta.nombre}
                          </td>
                          <td className="px-4 py-1.5 text-slate-600">{l.descripcion ?? ''}</td>
                          <td className="px-4 py-1.5 text-right tabular-nums text-slate-800">
                            {l.tipo === 'DEBITO' ? `RD$ ${fmt(Number(l.monto))}` : ''}
                          </td>
                          <td className="px-4 py-1.5 text-right tabular-nums text-slate-800">
                            {l.tipo === 'CREDITO' ? `RD$ ${fmt(Number(l.monto))}` : ''}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-semibold text-xs">
                        <td className="px-4 py-1.5" colSpan={2}>Totales</td>
                        <td className="px-4 py-1.5 text-right tabular-nums">RD$ {fmt(totalDebitos)}</td>
                        <td className="px-4 py-1.5 text-right tabular-nums">RD$ {fmt(totalCreditos)}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-500">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
