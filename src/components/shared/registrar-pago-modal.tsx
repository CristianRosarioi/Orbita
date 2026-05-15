'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { MetodoPago } from '@/types/enums';

interface Props {
  facturaId: string;
  saldoPendiente: number;
  onSuccess: () => void;
  trigger: React.ReactElement;
}

const METODOS_PAGO = [
  { value: MetodoPago.EFECTIVO, label: 'Efectivo' },
  { value: MetodoPago.TARJETA, label: 'Tarjeta' },
  { value: MetodoPago.TRANSFERENCIA, label: 'Transferencia' },
  { value: MetodoPago.CHEQUE, label: 'Cheque' },
];

export function RegistrarPagoModal({ facturaId, saldoPendiente, onSuccess, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [monto, setMonto] = useState(saldoPendiente.toFixed(2));
  const [metodoPago, setMetodoPago] = useState(MetodoPago.EFECTIVO);
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error('El monto debe ser mayor a 0.');
      return;
    }
    if (montoNum > saldoPendiente + 0.01) {
      toast.error('El monto no puede superar el saldo pendiente.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/facturas/${facturaId}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: montoNum,
          metodoPago,
          referencia: referencia || undefined,
          notas: notas || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al registrar el pago.');
        return;
      }

      toast.success('Pago registrado correctamente.');
      setOpen(false);
      onSuccess();
    } catch {
      toast.error('Ocurrió un error al registrar el pago.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="monto-pago">
              Monto (saldo pendiente: RD$ {saldoPendiente.toFixed(2)})
            </Label>
            <Input
              id="monto-pago"
              type="number"
              min="0.01"
              step="0.01"
              max={saldoPendiente}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="metodo-pago-select">Método de pago</Label>
            <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as typeof metodoPago)}>
              <SelectTrigger id="metodo-pago-select" className="w-full">
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                {METODOS_PAGO.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="referencia-pago">Referencia (opcional)</Label>
            <Input
              id="referencia-pago"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Número de transferencia, cheque, etc."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notas-pago">Notas (opcional)</Label>
            <Input
              id="notas-pago"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
