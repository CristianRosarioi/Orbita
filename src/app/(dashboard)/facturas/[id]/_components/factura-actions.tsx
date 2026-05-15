'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RegistrarPagoModal } from '@/components/shared/registrar-pago-modal';
import { AnularFacturaModal } from '@/components/shared/anular-factura-modal';
import { toast } from 'sonner';
import { CheckCircle, XCircle, DollarSign } from 'lucide-react';

interface Props {
  facturaId: string;
  estado: string;
  saldo: number;
}

export function FacturaActions({ facturaId, estado, saldo }: Props) {
  const router = useRouter();
  const [emitiendo, setEmitiendo] = useState(false);

  async function handleEmitir() {
    setEmitiendo(true);
    try {
      const res = await fetch(`/api/facturas/${facturaId}/emitir`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al emitir la factura.');
        return;
      }
      toast.success('Factura emitida correctamente.');
      router.refresh();
    } catch {
      toast.error('Ocurrió un error al emitir la factura.');
    } finally {
      setEmitiendo(false);
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {estado === 'BORRADOR' && (
        <Button onClick={handleEmitir} disabled={emitiendo}>
          <CheckCircle className="h-4 w-4 mr-1.5" />
          {emitiendo ? 'Emitiendo...' : 'Emitir factura'}
        </Button>
      )}

      {(estado === 'EMITIDA' || estado === 'VENCIDA') && saldo > 0 && (
        <RegistrarPagoModal
          facturaId={facturaId}
          saldoPendiente={saldo}
          onSuccess={() => router.refresh()}
          trigger={
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-1.5" />
              Registrar pago
            </Button>
          }
        />
      )}

      {(estado === 'BORRADOR' || estado === 'EMITIDA' || estado === 'PAGADA') && (
        <AnularFacturaModal
          facturaId={facturaId}
          onSuccess={() => router.refresh()}
          trigger={
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
              <XCircle className="h-4 w-4 mr-1.5" />
              Anular
            </Button>
          }
        />
      )}
    </div>
  );
}
