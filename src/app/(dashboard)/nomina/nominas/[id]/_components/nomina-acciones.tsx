'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign, Trash2 } from 'lucide-react';

interface Props {
  nominaId: string;
  estado: string;
}

export default function NominaAcciones({ nominaId, estado }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accion(tipo: 'procesar' | 'pagar' | 'eliminar') {
    setError(null);
    setLoading(tipo);

    try {
      let res: Response;
      if (tipo === 'eliminar') {
        res = await fetch(`/api/nomina/nominas/${nominaId}`, { method: 'DELETE' });
      } else {
        res = await fetch(`/api/nomina/nominas/${nominaId}/${tipo}`, { method: 'POST' });
      }
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al ejecutar la acción.');
        return;
      }
      if (tipo === 'eliminar') {
        router.push('/nomina/nominas');
      }
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {estado === 'BORRADOR' && (
          <>
            <Button
              size="sm"
              onClick={() => accion('procesar')}
              disabled={loading !== null}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              {loading === 'procesar' ? 'Procesando...' : 'Procesar nómina'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => accion('eliminar')}
              disabled={loading !== null}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {loading === 'eliminar' ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </>
        )}
        {estado === 'PROCESADA' && (
          <Button
            size="sm"
            onClick={() => accion('pagar')}
            disabled={loading !== null}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <DollarSign className="h-4 w-4 mr-1.5" />
            {loading === 'pagar' ? 'Registrando pago...' : 'Marcar como pagada'}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
