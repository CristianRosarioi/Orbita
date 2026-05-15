'use client';

import { Badge } from '@/components/ui/badge';

const CONFIG: Record<string, { label: string; className: string }> = {
  BORRADOR: { label: 'Borrador', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  EMITIDA: { label: 'Emitida', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  PAGADA: { label: 'Pagada', className: 'bg-green-50 text-green-700 border-green-200' },
  ANULADA: { label: 'Anulada', className: 'bg-red-50 text-red-600 border-red-200' },
  VENCIDA: { label: 'Vencida', className: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export function FacturaStatusBadge({ estado }: { estado: string }) {
  const cfg = CONFIG[estado] ?? { label: estado, className: '' };
  return (
    <Badge variant="outline" className={`text-xs ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}
