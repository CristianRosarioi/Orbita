'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { sincronizarVentasPendientes } from '@/lib/sync';

export function ConnectionStatus() {
  const [online, setOnline] = useState(() =>
    typeof window !== 'undefined' ? navigator.onLine : true,
  );
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const onRestoreConnection = useCallback(async () => {
    setMensaje('Conexión restaurada — Sincronizando...');
    setSincronizando(true);
    try {
      const resultado = await sincronizarVentasPendientes();
      if (resultado.ok > 0) {
        setMensaje(
          `${resultado.ok} venta${resultado.ok > 1 ? 's' : ''} sincronizada${resultado.ok > 1 ? 's' : ''}`,
        );
      } else {
        setMensaje('');
      }
    } catch {
      setMensaje('');
    } finally {
      setSincronizando(false);
      setTimeout(() => setMensaje(''), 4000);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setOnline(true);
      onRestoreConnection();
    };
    const handleOffline = () => {
      setOnline(false);
      setMensaje('');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onRestoreConnection]);

  return (
    <div className="flex items-center gap-2">
      {mensaje && <span className="hidden text-xs text-emerald-600 sm:inline">{mensaje}</span>}
      {sincronizando && <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />}
      {online ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          <Wifi className="h-3 w-3" />
          <span className="hidden sm:inline">En línea</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
          <WifiOff className="h-3 w-3" />
          <span className="hidden sm:inline">Sin conexión</span>
        </span>
      )}
    </div>
  );
}
