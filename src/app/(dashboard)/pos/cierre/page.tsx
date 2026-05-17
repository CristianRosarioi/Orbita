'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, TrendingUp, CreditCard, Banknote, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ResumenCaja {
  sesion: {
    id: string;
    montoApertura: number;
    fechaApertura: string;
  };
  totalVendido: number;
  cantidadFacturas: number;
  desglosePorMetodo: Record<string, number>;
}

export default function CierreCajaPage() {
  const router = useRouter();
  const [resumen, setResumen] = useState<ResumenCaja | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(true); // true desde el inicio para evitar flash
  const [efectivoContado, setEfectivoContado] = useState('');
  const [notas, setNotas] = useState('');
  const [cargandoCierre, setCargandoCierre] = useState(false);
  const [error, setError] = useState('');
  const [cerrado, setCerrado] = useState(false);
  const [diferencia, setDiferencia] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/caja/resumen')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setResumen(d.data);
        } else {
          router.replace('/pos');
        }
      })
      .catch(() => router.replace('/pos'))
      .finally(() => setCargandoResumen(false));
  }, [router]);

  const handleCerrar = async () => {
    const monto = parseFloat(efectivoContado);
    if (isNaN(monto) || monto < 0) {
      setError('Ingresa el efectivo contado (0 o mayor).');
      return;
    }

    setCargandoCierre(true);
    setError('');

    try {
      const resp = await fetch('/api/caja/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoCierreDeclarado: monto, notas: notas || undefined }),
      });

      const data = await resp.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al cerrar la caja.');
        return;
      }

      setDiferencia(Number(data.data.diferencia));
      setCerrado(true);
    } catch {
      setError('Ocurrió un error. Por favor inténtalo de nuevo.');
    } finally {
      setCargandoCierre(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(n);

  const fmtFecha = (d: string) =>
    new Date(d).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const METODO_ICONS: Record<string, React.ReactNode> = {
    EFECTIVO: <Banknote className="h-4 w-4" />,
    TARJETA: <CreditCard className="h-4 w-4" />,
    TRANSFERENCIA: <ArrowRightLeft className="h-4 w-4" />,
  };

  const METODO_LABELS: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    TARJETA: 'Tarjeta',
    TRANSFERENCIA: 'Transferencia',
    CHEQUE: 'Cheque',
  };

  if (cargandoResumen) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Cargando resumen…</p>
      </div>
    );
  }

  if (!resumen) return null;

  if (cerrado && diferencia !== null) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <Card className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <TrendingUp className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Caja cerrada</h2>
          <p className="text-slate-500 text-sm">El resumen del turno ha sido guardado.</p>
          <div
            className={`p-4 rounded-lg ${diferencia < 0 ? 'bg-red-50' : diferencia > 0 ? 'bg-blue-50' : 'bg-green-50'}`}
          >
            <p className="text-sm text-slate-500 mb-1">Diferencia</p>
            <p
              className={`text-3xl font-bold ${diferencia < 0 ? 'text-red-600' : diferencia > 0 ? 'text-blue-600' : 'text-green-600'}`}
            >
              {diferencia >= 0 ? '+' : ''}RD$ {fmt(diferencia)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {diferencia < 0
                ? 'Faltante en caja'
                : diferencia > 0
                  ? 'Sobrante en caja'
                  : 'Sin diferencias'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/pos/historial')}
            >
              Ver historial
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => router.push('/pos/abrir-caja')}
            >
              Nuevo turno
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/pos" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cierre de caja</h1>
          <p className="text-slate-500 text-sm">
            Turno desde {fmtFecha(resumen.sesion.fechaApertura)}
          </p>
        </div>
      </div>

      {/* Resumen de ventas */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Resumen del turno
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-500">Total vendido</p>
            <p className="text-lg font-bold text-green-700">RD$ {fmt(resumen.totalVendido)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-500">Facturas emitidas</p>
            <p className="text-lg font-bold text-slate-900">{resumen.cantidadFacturas}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Desglose por método de pago</p>
          {Object.entries(resumen.desglosePorMetodo)
            .filter(([, v]) => v > 0)
            .map(([metodo, monto]) => (
              <div key={metodo} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  {METODO_ICONS[metodo]}
                  <span>{METODO_LABELS[metodo] ?? metodo}</span>
                </div>
                <span className="font-medium text-slate-900">RD$ {fmt(monto)}</span>
              </div>
            ))}
          {Object.values(resumen.desglosePorMetodo).every((v) => v === 0) && (
            <p className="text-sm text-slate-400">Sin ventas registradas en este turno.</p>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Monto de apertura</span>
          <span className="font-medium">RD$ {fmt(Number(resumen.sesion.montoApertura))}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Efectivo esperado en caja</span>
          <span className="font-semibold text-slate-900">
            RD${' '}
            {fmt(Number(resumen.sesion.montoApertura) + (resumen.desglosePorMetodo.EFECTIVO ?? 0))}
          </span>
        </div>
      </Card>

      {/* Formulario de cierre */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Conteo de efectivo
        </h2>

        <div>
          <Label htmlFor="efectivo" className="text-sm font-medium">
            Efectivo físico contado (RD$)
          </Label>
          <Input
            id="efectivo"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={efectivoContado}
            onChange={(e) => setEfectivoContado(e.target.value)}
            className="mt-1.5 text-xl font-semibold h-12"
            autoFocus
          />
          <p className="text-xs text-slate-400 mt-1">
            Cuenta el efectivo en la caja y regístralo aquí
          </p>
        </div>

        <div>
          <Label htmlFor="notas-cierre" className="text-sm font-medium">
            Notas (opcional)
          </Label>
          <Input
            id="notas-cierre"
            placeholder="Observaciones del turno"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="mt-1.5"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Button
          onClick={handleCerrar}
          disabled={cargandoCierre || !efectivoContado}
          className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          {cargandoCierre ? 'Cerrando caja…' : 'Cerrar caja'}
        </Button>
      </Card>
    </div>
  );
}
