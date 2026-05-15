'use client';

import { Badge } from '@/components/ui/badge';

interface ProductoCardPOSProps {
  id: string;
  nombre: string;
  sku?: string | null;
  precioVenta: number;
  stockActual: number;
  tipo: string;
  onAgregar: (id: string) => void;
}

export function ProductoCardPOS({
  id,
  nombre,
  sku,
  precioVenta,
  stockActual,
  tipo,
  onAgregar,
}: ProductoCardPOSProps) {
  const sinStock = tipo === 'BIEN' && stockActual <= 0;

  return (
    <button
      type="button"
      disabled={sinStock}
      onClick={() => onAgregar(id)}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        sinStock
          ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
          : 'border-slate-200 bg-white hover:border-green-400 hover:shadow-md hover:bg-green-50 active:scale-95'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2">{nombre}</p>
        {sinStock && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            Agotado
          </Badge>
        )}
      </div>
      {sku && <p className="text-xs text-slate-400 mt-0.5">SKU: {sku}</p>}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-base font-bold text-green-700">
          RD${' '}
          {new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(precioVenta)}
        </span>
        {tipo === 'BIEN' && (
          <span className="text-xs text-slate-400">{stockActual} en stock</span>
        )}
      </div>
    </button>
  );
}
