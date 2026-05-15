'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CarritoItemProps {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  onIncrementar: (id: string) => void;
  onDecrementar: (id: string) => void;
  onEliminar: (id: string) => void;
}

export function CarritoItem({
  id,
  nombre,
  cantidad,
  precioUnitario,
  subtotal,
  onIncrementar,
  onDecrementar,
  onEliminar,
}: CarritoItemProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(n);

  return (
    <div className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{nombre}</p>
        <p className="text-xs text-slate-400">RD$ {fmt(precioUnitario)} c/u</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={() => onDecrementar(id)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center text-sm font-semibold">{cantidad}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={() => onIncrementar(id)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="w-20 text-right shrink-0">
        <p className="text-sm font-semibold text-slate-900">RD$ {fmt(subtotal)}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
        onClick={() => onEliminar(id)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
