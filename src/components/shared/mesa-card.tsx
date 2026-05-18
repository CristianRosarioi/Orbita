'use client';

import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MesaCardProps {
  numero: number;
  nombre?: string | null;
  capacidad: number;
  estado: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'INACTIVA';
  comandaNumero?: number | null;
  onClick?: () => void;
}

const ESTADO_STYLES = {
  DISPONIBLE: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-pointer',
  OCUPADA: 'bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer',
  RESERVADA: 'bg-amber-50 border-amber-200 hover:bg-amber-100 cursor-pointer',
  INACTIVA: 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed',
};

const ESTADO_BADGE = {
  DISPONIBLE: 'bg-emerald-100 text-emerald-700',
  OCUPADA: 'bg-red-100 text-red-700',
  RESERVADA: 'bg-amber-100 text-amber-700',
  INACTIVA: 'bg-slate-200 text-slate-500',
};

const ESTADO_LABEL = {
  DISPONIBLE: 'Disponible',
  OCUPADA: 'Ocupada',
  RESERVADA: 'Reservada',
  INACTIVA: 'Inactiva',
};

export function MesaCard({
  numero,
  nombre,
  capacidad,
  estado,
  comandaNumero,
  onClick,
}: MesaCardProps) {
  return (
    <div
      onClick={estado !== 'INACTIVA' ? onClick : undefined}
      className={cn(
        'rounded-2xl border-2 p-5 flex flex-col items-center gap-2 transition-colors select-none',
        ESTADO_STYLES[estado],
      )}
    >
      <div className="text-4xl font-bold text-slate-800">{numero}</div>
      {nombre && <p className="text-xs text-slate-500 font-medium">{nombre}</p>}

      <div className="flex items-center gap-1 text-slate-400">
        {Array.from({ length: Math.min(capacidad, 6) }).map((_, i) => (
          <Users key={i} className="h-3 w-3" />
        ))}
        {capacidad > 6 && <span className="text-xs">+{capacidad - 6}</span>}
      </div>

      <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', ESTADO_BADGE[estado])}>
        {ESTADO_LABEL[estado]}
      </span>

      {comandaNumero && <span className="text-xs text-slate-500">Comanda #{comandaNumero}</span>}
    </div>
  );
}
