'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Props {
  facturaId: string;
  onSuccess: () => void;
  trigger: React.ReactElement;
}

export function AnularFacturaModal({ facturaId, onSuccess, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState('');

  async function handleConfirm() {
    if (motivo.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/facturas/${facturaId}/anular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivo.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al anular la factura.');
        return;
      }

      toast.success('Factura anulada correctamente.');
      setOpen(false);
      setMotivo('');
      onSuccess();
    } catch {
      toast.error('Ocurrió un error al anular la factura.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Anular esta factura?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. La factura quedará marcada como anulada y se restaurará el
            inventario afectado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5 py-2">
          <Label htmlFor="motivo-anulacion">Motivo de anulación *</Label>
          <Textarea
            id="motivo-anulacion"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Describe el motivo de la anulación (mínimo 10 caracteres)"
            rows={3}
            className="text-sm"
          />
          {motivo.length > 0 && motivo.length < 10 && (
            <p className="text-xs text-red-500">Mínimo 10 caracteres ({motivo.length}/10)</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setMotivo('')} disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || motivo.trim().length < 10}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Anulando...' : 'Anular factura'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
