'use client';

import { useState } from 'react';
import { CreditCard, Banknote, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';

interface CobroPanelProps {
  total: number;
  subtotal: number;
  itbis: number;
  descuento: number;
  onDescuentoChange: (v: number) => void;
  onCobrar: (metodo: MetodoPago, montoRecibido?: number) => void;
  cargando: boolean;
  deshabilitado: boolean;
}

const METODOS: { value: MetodoPago; label: string; icon: React.ReactNode }[] = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: <Banknote className="h-4 w-4" /> },
  { value: 'TARJETA', label: 'Tarjeta', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: <ArrowRightLeft className="h-4 w-4" /> },
];

export function CobrarPanel({
  total,
  subtotal,
  itbis,
  descuento,
  onDescuentoChange,
  onCobrar,
  cargando,
  deshabilitado,
}: CobroPanelProps) {
  const [metodo, setMetodo] = useState<MetodoPago>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(n);

  const cambio = metodo === 'EFECTIVO' && montoRecibido
    ? Math.max(0, parseFloat(montoRecibido) - total)
    : 0;

  const handleCobrar = () => {
    const recibido = metodo === 'EFECTIVO' && montoRecibido ? parseFloat(montoRecibido) : undefined;
    onCobrar(metodo, recibido);
  };

  return (
    <div className="space-y-4">
      {/* Totales */}
      <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>RD$ {fmt(subtotal)}</span>
        </div>
        {itbis > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>ITBIS (18%)</span>
            <span>RD$ {fmt(itbis)}</span>
          </div>
        )}
        {descuento > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Descuento</span>
            <span>- RD$ {fmt(descuento)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xl text-slate-900 border-t border-slate-200 pt-2 mt-2">
          <span>TOTAL</span>
          <span className="text-green-700">RD$ {fmt(total)}</span>
        </div>
      </div>

      {/* Descuento global */}
      <div>
        <Label className="text-xs text-slate-500">Descuento (RD$)</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          className="mt-1"
          onChange={(e) => onDescuentoChange(parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Métodos de pago */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Método de pago</p>
        <div className="grid grid-cols-3 gap-1.5">
          {METODOS.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMetodo(value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                metodo === value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Monto recibido (solo efectivo) */}
      {metodo === 'EFECTIVO' && (
        <div>
          <Label className="text-xs text-slate-500">Monto recibido (RD$)</Label>
          <Input
            type="number"
            min={total}
            step="0.01"
            placeholder={fmt(total)}
            value={montoRecibido}
            onChange={(e) => setMontoRecibido(e.target.value)}
            className="mt-1 text-lg font-semibold"
          />
          {cambio > 0 && (
            <p className="text-sm font-semibold text-blue-600 mt-1">
              Cambio: RD$ {fmt(cambio)}
            </p>
          )}
        </div>
      )}

      {/* Botón cobrar */}
      <Button
        onClick={handleCobrar}
        disabled={deshabilitado || cargando || total <= 0}
        className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
      >
        {cargando ? 'Procesando…' : `COBRAR RD$ ${fmt(total)}`}
      </Button>
    </div>
  );
}
