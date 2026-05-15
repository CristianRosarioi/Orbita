'use client';

import { useState } from 'react';
import { Printer } from 'lucide-react';
import { generarTicketPOS } from '@/lib/ticket-pdf';

interface ImprimirTicketButtonProps {
  facturaId: string;
}

export function ImprimirTicketButton({ facturaId }: ImprimirTicketButtonProps) {
  const [cargando, setCargando] = useState(false);

  const handleImprimir = async () => {
    setCargando(true);
    try {
      const [respFactura, respEmpresa] = await Promise.all([
        fetch(`/api/facturas/${facturaId}`),
        fetch('/api/empresas/activa'),
      ]);

      const [dataFactura, dataEmpresa] = await Promise.all([
        respFactura.json(),
        respEmpresa.json(),
      ]);

      if (!dataFactura.success || !dataEmpresa.success) {
        alert('No se pudo cargar la información para imprimir.');
        return;
      }

      const f = dataFactura.data;
      const blob = generarTicketPOS(
        {
          numero: f.numero,
          fechaEmision: f.fechaEmision,
          metodoPago: f.metodoPago,
          subtotal: Number(f.subtotal),
          itbis: Number(f.itbis),
          descuento: Number(f.descuento),
          total: Number(f.total),
          clienteNombre: f.clienteNombre,
          items: f.items.map((i: { productoNombre: string; cantidad: string | number; precioUnitario: string | number; total: string | number }) => ({
            productoNombre: i.productoNombre,
            cantidad: Number(i.cantidad),
            precioUnitario: Number(i.precioUnitario),
            total: Number(i.total),
          })),
        },
        dataEmpresa.data,
      );

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      alert('Error al generar el ticket.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <button
      onClick={handleImprimir}
      disabled={cargando}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Printer className="h-4 w-4" />
      {cargando ? 'Generando…' : 'Imprimir'}
    </button>
  );
}
