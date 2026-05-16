'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Scale, Wallet } from 'lucide-react';

interface Totales {
  activo: number;
  pasivo: number;
  patrimonio: number;
  ingreso: number;
  gasto: number;
}

interface CuentaBalance {
  codigo: string;
  nombre: string;
  tipo: string;
  saldo: number;
}

interface BalanceData {
  cuentas: CuentaBalance[];
  totales: Totales;
}

interface ResultadosData {
  totalIngresos: number;
  totalGastos: number;
  utilidadNeta: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(n);
}

export default function ContabilidadPage() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [resultados, setResultados] = useState<ResultadosData | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const anio = new Date().getFullYear();
        const mes = new Date().getMonth() + 1;
        const [resBalance, resResultados] = await Promise.all([
          fetch('/api/contabilidad/balance'),
          fetch(`/api/contabilidad/resultados?mes=${mes}&anio=${anio}`),
        ]);
        const [b, r] = await Promise.all([resBalance.json(), resResultados.json()]);
        if (b.success) setBalance(b.data);
        if (r.success) setResultados(r.data);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  if (cargando) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Cargando balance...</p>
      </div>
    );
  }

  const t = balance?.totales;
  const ecuacion = t ? t.activo - t.pasivo - t.patrimonio : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Balance General</h1>
        <p className="text-slate-500 text-sm mt-1">Estado financiero acumulado de tu empresa</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-500 font-medium">Total Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-slate-900">RD$ {fmt(t?.activo ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-500 font-medium">Total Pasivos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-600">RD$ {fmt(t?.pasivo ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-500 font-medium">Patrimonio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-blue-600">RD$ {fmt(t?.patrimonio ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Scale className="h-3 w-3" /> Ecuación contable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={Math.abs(ecuacion) < 0.01 ? 'default' : 'destructive'}>
              {Math.abs(ecuacion) < 0.01 ? 'Cuadrada' : `Desbalance: ${fmt(ecuacion)}`}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Estado de resultados del mes */}
      {resultados && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {resultados.utilidadNeta >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              Estado de Resultados — Mes actual
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Ingresos totales</p>
              <p className="text-lg font-semibold text-green-600">
                RD$ {fmt(resultados.totalIngresos)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Gastos totales</p>
              <p className="text-lg font-semibold text-red-600">
                RD$ {fmt(resultados.totalGastos)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Utilidad neta</p>
              <p
                className={`text-lg font-bold ${resultados.utilidadNeta >= 0 ? 'text-green-700' : 'text-red-700'}`}
              >
                RD$ {fmt(resultados.utilidadNeta)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance por grupo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO'] as const).map((tipo) => {
          const cuentas = balance?.cuentas.filter((c) => c.tipo === tipo && c.saldo !== 0) ?? [];
          if (cuentas.length === 0) return null;
          const total = cuentas.reduce((s, c) => s + c.saldo, 0);
          const colores: Record<string, string> = {
            ACTIVO: 'text-blue-700',
            PASIVO: 'text-red-700',
            PATRIMONIO: 'text-purple-700',
            INGRESO: 'text-green-700',
            GASTO: 'text-orange-700',
          };
          return (
            <Card key={tipo}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-semibold ${colores[tipo]}`}>
                  {tipo === 'ACTIVO'
                    ? 'Activos'
                    : tipo === 'PASIVO'
                      ? 'Pasivos'
                      : tipo === 'PATRIMONIO'
                        ? 'Patrimonio'
                        : tipo === 'INGRESO'
                          ? 'Ingresos'
                          : 'Gastos'}
                  <span className="ml-2 text-slate-500 font-normal">RD$ {fmt(total)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {cuentas.map((c) => (
                    <div key={c.codigo} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {c.codigo} — {c.nombre}
                      </span>
                      <span className="font-medium tabular-nums">RD$ {fmt(c.saldo)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {balance?.cuentas.every((c) => c.saldo === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No hay movimientos contables todavía.</p>
            <p className="text-slate-400 text-xs mt-1">
              Los asientos se crean automáticamente al emitir facturas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
