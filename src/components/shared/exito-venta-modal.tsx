'use client';

import { CheckCircle2, Printer, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ExitoVentaModalProps {
  abierto: boolean;
  numeroFactura: string;
  total: number;
  cambio: number;
  onImprimir: () => void;
  onNuevaVenta: () => void;
}

export function ExitoVentaModal({
  abierto,
  numeroFactura,
  total,
  cambio,
  onImprimir,
  onNuevaVenta,
}: ExitoVentaModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(n);

  return (
    <Dialog open={abierto} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            ¡Venta completada!
          </DialogTitle>
        </DialogHeader>

        <div className="text-center py-4 space-y-1">
          <p className="text-slate-500 text-sm">Factura</p>
          <p className="text-2xl font-bold text-slate-900 font-mono">{numeroFactura}</p>
          <p className="text-slate-500 text-sm mt-3">Total cobrado</p>
          <p className="text-3xl font-bold text-green-700">RD$ {fmt(total)}</p>
          {cambio > 0 && (
            <p className="text-lg font-semibold text-blue-600 mt-2">Cambio: RD$ {fmt(cambio)}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onImprimir} variant="outline" className="w-full gap-2">
            <Printer className="h-4 w-4" />
            Imprimir ticket
          </Button>
          <Button
            onClick={onNuevaVenta}
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <ShoppingCart className="h-4 w-4" />
            Nueva venta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
