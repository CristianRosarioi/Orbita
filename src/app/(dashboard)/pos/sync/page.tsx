'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Users,
} from 'lucide-react';
import { db } from '@/lib/db-local';
import { sincronizarTodo, sincronizarVentasPendientes } from '@/lib/sync';
import type { SyncResult } from '@/lib/sync';

function formatHora(ts: number) {
  return new Date(ts).toLocaleString('es-DO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function SyncPage() {
  const [online, setOnline] = useState(() =>
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [sincronizando, setSincronizando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<SyncResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const totalProductos = useLiveQuery(() => db.productos.count(), []) ?? 0;
  const totalClientes = useLiveQuery(() => db.clientes.count(), []) ?? 0;
  const ventasPendientes = useLiveQuery(
    () => db.ventasOffline.where('estado').equals('PENDIENTE_SYNC').toArray(),
    [],
  ) ?? [];
  const historialVentas = useLiveQuery(
    () => db.ventasOffline.orderBy('creadoEn').reverse().limit(20).toArray(),
    [],
  ) ?? [];

  const sincronizar = useCallback(async () => {
    if (!online) return;
    setSincronizando(true);
    setError('');
    try {
      const ventas = await sincronizarVentasPendientes();
      setUltimoResultado({ productos: 0, clientes: 0, ventasOk: ventas.ok, ventasErrores: ventas.errores });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de sincronización');
    } finally {
      setSincronizando(false);
    }
  }, [online]);

  const actualizarCatalogo = useCallback(async () => {
    if (!online) return;
    setDescargando(true);
    setError('');
    try {
      // Obtener empresaId de la config local
      const cfg = await db.config.get('empresaId');
      const empresaId = cfg?.value ?? '';
      const resultado = await sincronizarTodo(empresaId);
      setUltimoResultado(resultado);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar catálogo');
    } finally {
      setDescargando(false);
    }
  }, [online]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Sincronización</h1>
        <p className="text-sm text-slate-500">Estado del POS offline y sincronización con el servidor</p>
      </div>

      {/* Estado de conexión */}
      <div
        className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${
          online
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-red-200 bg-red-50'
        }`}
      >
        {online ? (
          <Wifi className="h-6 w-6 text-emerald-600" />
        ) : (
          <WifiOff className="h-6 w-6 text-red-600" />
        )}
        <div>
          <p className={`font-semibold ${online ? 'text-emerald-800' : 'text-red-800'}`}>
            {online ? 'En línea' : 'Sin conexión'}
          </p>
          <p className={`text-xs ${online ? 'text-emerald-600' : 'text-red-600'}`}>
            {online
              ? 'Las sincronizaciones están disponibles'
              : 'Las ventas se guardan localmente hasta recuperar la conexión'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {ultimoResultado && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Última sincronización: {ultimoResultado.productos > 0 && `${ultimoResultado.productos} productos, `}
          {ultimoResultado.clientes > 0 && `${ultimoResultado.clientes} clientes, `}
          {ultimoResultado.ventasOk} ventas enviadas
          {ultimoResultado.ventasErrores > 0 && `, ${ultimoResultado.ventasErrores} con error`}
        </div>
      )}

      {/* Stats de caché */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-medium text-slate-500">Productos en caché</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalProductos}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-medium text-slate-500">Clientes en caché</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalClientes}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-medium text-slate-500">Ventas pendientes</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{ventasPendientes.length}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={sincronizar}
          disabled={!online || sincronizando}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
          {sincronizando ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>
        <button
          onClick={actualizarCatalogo}
          disabled={!online || descargando}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className={`h-4 w-4 ${descargando ? 'animate-bounce' : ''}`} />
          {descargando ? 'Descargando...' : 'Actualizar catálogo'}
        </button>
      </div>

      {/* Ventas pendientes */}
      {ventasPendientes.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 font-semibold text-slate-900">Ventas pendientes de sync</h2>
          <div className="space-y-2">
            {ventasPendientes.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    {v.clienteNombre ?? 'Cliente anónimo'}
                  </p>
                  <p className="text-xs text-amber-700">{formatHora(v.creadoEn)}</p>
                </div>
                <p className="text-sm font-bold text-amber-900">
                  RD${v.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Historial de ventas</h2>
        {historialVentas.length === 0 ? (
          <p className="text-sm text-slate-400">No hay ventas registradas offline.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold text-slate-500">Fecha</th>
                  <th className="px-4 py-2 text-xs font-semibold text-slate-500">Cliente</th>
                  <th className="px-4 py-2 text-xs font-semibold text-slate-500">Total</th>
                  <th className="px-4 py-2 text-xs font-semibold text-slate-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {historialVentas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs text-slate-500">{formatHora(v.creadoEn)}</td>
                    <td className="px-4 py-2.5 text-slate-700">{v.clienteNombre ?? '—'}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      RD${v.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5">
                      {v.estado === 'SINCRONIZADA' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          <CheckCircle className="h-3 w-3" /> Sincronizada
                        </span>
                      )}
                      {v.estado === 'PENDIENTE_SYNC' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                          <Clock className="h-3 w-3" /> Pendiente
                        </span>
                      )}
                      {v.estado === 'ERROR_SYNC' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                          <XCircle className="h-3 w-3" /> Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
