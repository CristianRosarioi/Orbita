'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FiadoAbonoModalProps {
  cuentaId: string;
  clienteNombre: string;
  saldoActual: number;
  onClose: () => void;
}

export function FiadoAbonoModal({ cuentaId, clienteNombre, saldoActual, onClose }: FiadoAbonoModalProps) {
  const router = useRouter();
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) { setError('Ingresa un monto válido.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/colmado/fiado/${cuentaId}/abono`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: montoNum, descripcion: descripcion || undefined }),
      });

      const data = await res.json();
      if (!data.success) { setError(data.error?.message ?? 'Error al registrar el abono.'); return; }

      router.refresh();
      onClose();
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Registrar abono</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-4">
          <p className="text-sm text-slate-600">{clienteNombre}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Saldo pendiente: <span className="font-semibold text-red-600">
              RD$ {saldoActual.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto del abono (RD$)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Pago en efectivo"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar abono'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
