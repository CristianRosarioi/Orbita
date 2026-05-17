'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EstadoFiado = 'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO' | 'VENCIDO';

interface CuentaFiado {
  id: string;
  estado: EstadoFiado;
  limite: number | null;
  saldo: number;
  cliente: {
    id: string;
    nombre: string;
    telefono: string | null;
  };
}

interface Resumen {
  totalPendiente: number;
  totalCuentas: number;
  cuentasActivas: number;
  topDeudores: Array<{ cliente: { nombre: string } }>;
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

export default function FiadoPage() {
  const router = useRouter();
  const [cuentas, setCuentas] = useState<CuentaFiado[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoClienteId, setNuevoClienteId] = useState('');
  const [nuevoLimite, setNuevoLimite] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');

  const cargar = useCallback(async () => {
    try {
      const params = busqueda ? `?search=${encodeURIComponent(busqueda)}` : '';
      const [resCuentas, resResumen] = await Promise.all([
        fetch(`/api/colmado/fiado${params}`),
        fetch('/api/colmado/fiado/resumen'),
      ]);
      const [dataCuentas, dataResumen] = await Promise.all([resCuentas.json(), resResumen.json()]);
      if (dataCuentas.success) setCuentas(dataCuentas.data);
      if (dataResumen.success) setResumen(dataResumen.data);
    } finally {
      setLoading(false);
    }
  }, [busqueda]);

  useEffect(() => { cargar(); }, [cargar]);

  async function crearCuenta(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoClienteId.trim()) { setErrorCrear('Ingresa el ID del cliente.'); return; }
    setCreando(true);
    setErrorCrear('');
    try {
      const res = await fetch('/api/colmado/fiado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: nuevoClienteId.trim(),
          limite: nuevoLimite ? parseFloat(nuevoLimite) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setErrorCrear(data.error?.message ?? 'Error al crear la cuenta.'); return; }
      setMostrarFormulario(false);
      setNuevoClienteId('');
      setNuevoLimite('');
      await cargar();
      router.push(`/colmado/fiado/${data.data.id}`);
    } catch {
      setErrorCrear('Error de conexión.');
    } finally {
      setCreando(false);
    }
  }

  const porcentajeUsado = (cuenta: CuentaFiado) => {
    if (!cuenta.limite || cuenta.limite <= 0) return null;
    return Math.min(100, (Number(cuenta.saldo) / Number(cuenta.limite)) * 100);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fiado</h1>
          <p className="text-slate-500 text-sm mt-1">Cuentas de crédito de clientes</p>
        </div>
        <Button onClick={() => setMostrarFormulario(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva cuenta
        </Button>
      </div>

      {/* KPIs */}
      {resumen && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Total pendiente</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              RD$ {resumen.totalPendiente.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Cuentas activas</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{resumen.cuentasActivas}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total cuentas</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">{resumen.totalCuentas}</p>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : cuentas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">Sin cuentas de fiado</p>
          <p className="text-sm text-slate-400 mt-1">Agrega la primera cuenta de crédito</p>
          <Button className="mt-4" onClick={() => setMostrarFormulario(true)}>
            Crear primera cuenta
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {cuentas.map((cuenta) => {
            const pct = porcentajeUsado(cuenta);
            return (
              <div
                key={cuenta.id}
                onClick={() => router.push(`/colmado/fiado/${cuenta.id}`)}
                className="bg-white rounded-2xl border border-slate-200 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{cuenta.cliente.nombre}</p>
                    {cuenta.cliente.telefono && (
                      <p className="text-xs text-slate-400">{cuenta.cliente.telefono}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600 text-lg">
                      RD$ {Number(cuenta.saldo).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_BADGE[cuenta.estado]}`}>
                      {ESTADO_LABEL[cuenta.estado]}
                    </span>
                  </div>
                </div>

                {pct !== null && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Crédito usado</span>
                      <span>
                        RD$ {Number(cuenta.limite!).toLocaleString('es-DO', { minimumFractionDigits: 0 })} límite
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear cuenta */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Nueva cuenta de fiado</h2>
            <form onSubmit={crearCuenta} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID del cliente</label>
                <input
                  type="text"
                  value={nuevoClienteId}
                  onChange={(e) => setNuevoClienteId(e.target.value)}
                  placeholder="ID del cliente en el sistema"
                  autoFocus
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Límite de crédito (RD$) — opcional</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={nuevoLimite}
                  onChange={(e) => setNuevoLimite(e.target.value)}
                  placeholder="Sin límite"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {errorCrear && <p className="text-sm text-red-600">{errorCrear}</p>}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setMostrarFormulario(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={creando}>
                  {creando ? 'Creando...' : 'Crear cuenta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
