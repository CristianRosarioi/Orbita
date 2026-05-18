'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FiadoAbonoModal } from '@/components/shared/fiado-abono-modal';

type EstadoFiado = 'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO' | 'VENCIDO';
type TipoMovimiento = 'CARGO' | 'ABONO';

interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  monto: number;
  descripcion: string | null;
  createdAt: string;
}

interface CuentaFiadoDetalle {
  id: string;
  estado: EstadoFiado;
  limite: number | null;
  saldo: number;
  notas: string | null;
  cliente: {
    id: string;
    nombre: string;
    telefono: string | null;
    email: string | null;
  };
  movimientos: Movimiento[];
}

const ESTADO_BADGE: Record<EstadoFiado, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  PAGADO_PARCIAL: 'bg-blue-100 text-blue-700',
  PAGADO: 'bg-emerald-100 text-emerald-700',
  VENCIDO: 'bg-red-100 text-red-700',
};

const ESTADO_LABEL: Record<EstadoFiado, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO_PARCIAL: 'Pago parcial',
  PAGADO: 'Pagado',
  VENCIDO: 'Vencido',
};

export default function FiadoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cuenta, setCuenta] = useState<CuentaFiadoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarAbono, setMostrarAbono] = useState(false);
  const [mostrarCargo, setMostrarCargo] = useState(false);
  const [montoCargo, setMontoCargo] = useState('');
  const [descCargo, setDescCargo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/colmado/fiado/${id}`);
      const data = await res.json();
      if (data.success) setCuenta(data.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function registrarCargo(e: React.FormEvent) {
    e.preventDefault();
    const monto = parseFloat(montoCargo);
    if (!monto || monto <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`/api/colmado/fiado/${id}/cargo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto, descripcion: descCargo || undefined }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al registrar el cargo.');
        return;
      }
      setMostrarCargo(false);
      setMontoCargo('');
      setDescCargo('');
      await cargar();
    } catch {
      setError('Error de conexión.');
    } finally {
      setCargando(false);
    }
  }

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!cuenta) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-slate-500">Cuenta no encontrada.</p>
      </div>
    );
  }

  const esPagado = cuenta.estado === 'PAGADO';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {cuenta.cliente.nombre}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_BADGE[cuenta.estado]}`}
            >
              {ESTADO_LABEL[cuenta.estado]}
            </span>
            {cuenta.cliente.telefono && (
              <span className="text-sm text-slate-400">{cuenta.cliente.telefono}</span>
            )}
          </div>
        </div>
      </div>

      {/* KPIs y acciones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 sm:col-span-1">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">
            Saldo pendiente
          </p>
          <p className="text-2xl font-bold text-red-700 mt-1">
            RD$ {Number(cuenta.saldo).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
          {cuenta.limite && Number(cuenta.limite) > 0 && (
            <p className="text-xs text-red-400 mt-1">
              Límite: RD${' '}
              {Number(cuenta.limite).toLocaleString('es-DO', { minimumFractionDigits: 0 })}
            </p>
          )}
        </div>

        <div className="flex gap-3 sm:col-span-2 items-center">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => {
              setMostrarCargo(true);
              setError('');
            }}
            disabled={esPagado}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo cargo
          </Button>
          <Button
            className="flex-1"
            onClick={() => setMostrarAbono(true)}
            disabled={Number(cuenta.saldo) <= 0}
          >
            <Minus className="h-4 w-4 mr-1.5" />
            Registrar abono
          </Button>
        </div>
      </div>

      {/* Historial de movimientos */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="font-semibold text-slate-800 text-sm">
            Historial ({cuenta.movimientos.length} movimientos)
          </p>
        </div>

        {cuenta.movimientos.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-400 text-sm">
            Sin movimientos registrados.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cuenta.movimientos.map((mov) => (
              <div key={mov.id} className="px-4 py-3 flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    mov.tipo === 'CARGO' ? 'bg-red-100' : 'bg-emerald-100'
                  }`}
                >
                  {mov.tipo === 'CARGO' ? (
                    <Plus className="h-4 w-4 text-red-600" />
                  ) : (
                    <Minus className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {mov.descripcion ?? (mov.tipo === 'CARGO' ? 'Cargo' : 'Abono')}
                  </p>
                  <p className="text-xs text-slate-400">{formatFecha(mov.createdAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-sm font-bold ${mov.tipo === 'CARGO' ? 'text-red-600' : 'text-emerald-600'}`}
                  >
                    {mov.tipo === 'CARGO' ? '+' : '−'} RD${' '}
                    {Number(mov.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal cargo */}
      {mostrarCargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Registrar cargo</h2>
            <form onSubmit={registrarCargo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto (RD$)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={montoCargo}
                  onChange={(e) => setMontoCargo(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={descCargo}
                  onChange={(e) => setDescCargo(e.target.value)}
                  placeholder="Ej. Compra de víveres"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setMostrarCargo(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={cargando}>
                  {cargando ? 'Registrando...' : 'Registrar cargo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal abono */}
      {mostrarAbono && (
        <FiadoAbonoModal
          cuentaId={id}
          clienteNombre={cuenta.cliente.nombre}
          saldoActual={Number(cuenta.saldo)}
          onClose={() => {
            setMostrarAbono(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}
