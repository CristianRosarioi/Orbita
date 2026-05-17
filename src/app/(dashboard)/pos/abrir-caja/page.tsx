'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface UltimaSesion {
  id: string;
  fechaApertura: string;
  fechaCierre: string | null;
  montoApertura: number;
  montoCierreDeclarado: number | null;
  diferencia: number | null;
}

export default function AbrirCajaPage() {
  const router = useRouter();
  const [montoApertura, setMontoApertura] = useState('');
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [ultimaSesion, setUltimaSesion] = useState<UltimaSesion | null>(null);

  useEffect(() => {
    // Verificar si ya hay una caja abierta
    fetch('/api/caja/sesion-activa')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          // Ya hay caja abierta — redirigir al POS
          router.replace('/pos');
        }
      });

    // Obtener la última sesión cerrada para referencia
    fetch('/api/caja/historial?limit=1')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.items?.length > 0) {
          setUltimaSesion(d.data.items[0]);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleAbrir = async () => {
    const monto = parseFloat(montoApertura);
    if (isNaN(monto) || monto < 0) {
      setError('Ingresa un monto de apertura válido (0 o mayor).');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const resp = await fetch('/api/caja/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoApertura: monto, notas: notas || undefined }),
      });

      const data = await resp.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al abrir la caja.');
        return;
      }

      router.push('/pos');
    } catch {
      setError('Ocurrió un error. Por favor inténtalo de nuevo.');
    } finally {
      setCargando(false);
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

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pos" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Abrir caja</h1>
          <p className="text-slate-500 text-sm">Registra el efectivo con el que inicias el turno</p>
        </div>
      </div>

      <Card className="p-6 space-y-5">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <DollarSign className="h-7 w-7 text-green-600" />
          </div>
        </div>

        <div>
          <Label htmlFor="monto" className="text-sm font-medium">
            Efectivo inicial (RD$)
          </Label>
          <Input
            id="monto"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={montoApertura}
            onChange={(e) => setMontoApertura(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAbrir()}
            className="mt-1.5 text-xl font-semibold h-12"
            autoFocus
          />
          <p className="text-xs text-slate-400 mt-1">
            Cuenta el efectivo en la caja y regístralo aquí
          </p>
        </div>

        <div>
          <Label htmlFor="notas" className="text-sm font-medium">
            Notas (opcional)
          </Label>
          <Input
            id="notas"
            placeholder="Ej: Turno mañana"
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
          onClick={handleAbrir}
          disabled={cargando}
          className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          {cargando ? 'Abriendo caja…' : 'Abrir caja'}
        </Button>
      </Card>

      {/* Última sesión cerrada */}
      {ultimaSesion && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Última sesión cerrada
          </p>
          <Card className="p-4 text-sm space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Apertura</span>
              <span>{fmtFecha(ultimaSesion.fechaApertura)}</span>
            </div>
            {ultimaSesion.fechaCierre && (
              <div className="flex justify-between">
                <span>Cierre</span>
                <span>{fmtFecha(ultimaSesion.fechaCierre)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Monto apertura</span>
              <span>RD$ {fmt(ultimaSesion.montoApertura)}</span>
            </div>
            {ultimaSesion.diferencia !== null && (
              <div
                className={`flex justify-between font-medium ${ultimaSesion.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                <span>Diferencia</span>
                <span>
                  {ultimaSesion.diferencia >= 0 ? '+' : ''}
                  RD$ {fmt(ultimaSesion.diferencia)}
                </span>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
