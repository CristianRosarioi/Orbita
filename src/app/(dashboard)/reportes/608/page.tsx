'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileDown, Search } from 'lucide-react';

interface Registro608 {
  ncf: string;
  tipoNcf: string;
  fechaAnulacion: string;
}

interface ReporteData {
  periodo: { mes: number; anio: number };
  modoFiscal: string;
  advertencia: string | null;
  cantidadRegistros: number;
  registros: Registro608[];
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export default function Reporte608Page() {
  const ahora = new Date();
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [datos, setDatos] = useState<ReporteData | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function generar() {
    setCargando(true);
    setErrorMsg(null);
    setDatos(null);
    try {
      const res = await fetch(`/api/reportes/608?mes=${mes}&anio=${anio}`);
      const d = await res.json();
      if (d.success) {
        setDatos(d.data);
      } else {
        setErrorMsg(d.error?.message ?? 'Error al generar el reporte.');
      }
    } catch {
      setErrorMsg('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  function descargar(formato: 'txt' | 'xlsx') {
    window.open(`/api/reportes/608/exportar?mes=${mes}&anio=${anio}&formato=${formato}`, '_blank');
  }

  const anios = Array.from({ length: 6 }, (_, i) => ahora.getFullYear() - i);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reporte 608</h1>
        <p className="text-slate-500 text-sm mt-1">Relación de comprobantes anulados</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Período</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Mes</label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Año</label>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={generar} disabled={cargando}>
            <Search className="h-4 w-4 mr-2" />
            {cargando ? 'Generando...' : 'Generar'}
          </Button>
          {datos && datos.cantidadRegistros > 0 && (
            <>
              <Button variant="outline" onClick={() => descargar('txt')}>
                <FileDown className="h-4 w-4 mr-2" />
                TXT (DGII)
              </Button>
              <Button variant="outline" onClick={() => descargar('xlsx')}>
                <FileDown className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-800">{errorMsg}</p>
        </div>
      )}

      {datos && (
        <>
          {datos.advertencia && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">{datos.advertencia}</p>
            </div>
          )}

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Comprobantes anulados — {MESES[mes - 1]} {anio}
              </CardTitle>
              <Badge variant={datos.cantidadRegistros > 0 ? 'destructive' : 'secondary'}>
                {datos.cantidadRegistros} anulados
              </Badge>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {datos.registros.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-500 text-sm">
                    No hay comprobantes anulados en este período.
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left px-4 py-2 font-medium text-slate-500">
                        NCF / Número
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">Tipo NCF</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">
                        Fecha Anulación
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.registros.map((r, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-sm">{r.ncf}</td>
                        <td className="px-4 py-2">{r.tipoNcf}</td>
                        <td className="px-4 py-2 text-slate-500">{r.fechaAnulacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
