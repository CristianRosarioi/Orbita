'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookMarked, Sparkles } from 'lucide-react';

interface CuentaContable {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  padre: string | null;
  esBase: boolean;
}

const TIPO_COLOR: Record<string, string> = {
  ACTIVO: 'bg-blue-100 text-blue-800',
  PASIVO: 'bg-red-100 text-red-800',
  PATRIMONIO: 'bg-purple-100 text-purple-800',
  INGRESO: 'bg-green-100 text-green-800',
  GASTO: 'bg-orange-100 text-orange-800',
};

const TIPO_LABEL: Record<string, string> = {
  ACTIVO: 'Activo',
  PASIVO: 'Pasivo',
  PATRIMONIO: 'Patrimonio',
  INGRESO: 'Ingreso',
  GASTO: 'Gasto',
};

export default function PlanCuentasPage() {
  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [cargando, setCargando] = useState(true);
  const [inicializando, setInicializando] = useState(false);
  const [mensajeIni, setMensajeIni] = useState<string | null>(null);

  // Carga inicial — solo setState después del await, nunca sincrónicamente en el efecto
  useEffect(() => {
    let cancelled = false;
    fetch('/api/contabilidad/cuentas')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          if (d.success) setCuentas(d.data);
          setCargando(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCargando(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Llamada desde botones — puede llamar setState sincrónicamente (no es un efecto)
  function recargar() {
    setCargando(true);
    fetch('/api/contabilidad/cuentas')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCuentas(d.data);
      })
      .finally(() => setCargando(false));
  }

  async function inicializar() {
    setInicializando(true);
    setMensajeIni(null);
    try {
      const res = await fetch('/api/contabilidad/inicializar', { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        setMensajeIni(`Plan de cuentas inicializado con ${d.data.cuentasCreadas} cuentas.`);
        recargar();
      } else {
        setMensajeIni(d.error?.message ?? 'Error al inicializar el plan de cuentas.');
      }
    } catch {
      setMensajeIni('No se pudo conectar con el servidor.');
    } finally {
      setInicializando(false);
    }
  }

  const grupos = ['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO'];

  if (cargando) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Cargando plan de cuentas...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6">
      <div className="flex items-center gap-3">
        <BookMarked className="h-6 w-6 text-slate-700" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Plan de Cuentas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Catálogo contable estándar dominicano</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {cuentas.length} cuentas
        </Badge>
      </div>

      {mensajeIni && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {mensajeIni}
        </div>
      )}

      {cuentas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <BookMarked className="h-10 w-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-slate-600 font-medium">Sin plan de cuentas</p>
              <p className="text-slate-400 text-sm mt-1">
                Esta empresa fue creada antes de la Fase 5. Inicializa el plan de cuentas dominicano
                estándar para habilitar la contabilidad de doble partida.
              </p>
            </div>
            <Button onClick={inicializar} disabled={inicializando}>
              <Sparkles className="h-4 w-4 mr-2" />
              {inicializando ? 'Inicializando...' : 'Inicializar plan de cuentas'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        grupos.map((tipo) => {
          const grupo = cuentas.filter((c) => c.tipo === tipo);
          if (grupo.length === 0) return null;
          return (
            <Card key={tipo}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TIPO_COLOR[tipo]}`}
                  >
                    {TIPO_LABEL[tipo] ?? tipo}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 w-24">
                        Código
                      </th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">
                        Nombre
                      </th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 w-24">
                        Padre
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-slate-600 text-xs">{c.codigo}</td>
                        <td className="px-4 py-2 text-slate-800">
                          <span className={c.padre ? 'ml-4' : 'font-semibold'}>{c.nombre}</span>
                        </td>
                        <td className="px-4 py-2 text-slate-400 font-mono text-xs">
                          {c.padre ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
