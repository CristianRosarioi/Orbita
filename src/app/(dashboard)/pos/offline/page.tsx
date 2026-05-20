'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, WifiOff, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { db } from '@/lib/db-local';
import { guardarVentaOffline } from '@/lib/sync';
import type { ProductoLocal } from '@/lib/db-local';

interface ItemCarrito {
  productoId: string;
  nombre: string;
  precio: number;
  itbis: number;
  cantidad: number;
}

function calcularTotales(items: ItemCarrito[]) {
  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const itbis = items.reduce((s, i) => s + i.precio * i.cantidad * (i.itbis / 100), 0);
  return { subtotal, itbis, total: subtotal + itbis };
}

export default function PosOfflinePage() {
  const router = useRouter();

  // Redirigir si hay conexión
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.onLine) {
      router.replace('/pos');
    }
  }, [router]);

  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  const productos = useLiveQuery(
    () =>
      busqueda.length >= 1
        ? db.productos
            .filter(
              (p) =>
                p.activo &&
                (p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                  (p.sku ?? '').toLowerCase().includes(busqueda.toLowerCase())),
            )
            .limit(20)
            .toArray()
        : db.productos.where('activo').equals(1).limit(30).toArray(),
    [busqueda],
  );

  const agregarAlCarrito = useCallback((prod: ProductoLocal) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.productoId === prod.id);
      if (existente) {
        return prev.map((i) => (i.productoId === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [
        ...prev,
        {
          productoId: prod.id,
          nombre: prod.nombre,
          precio: prod.precio,
          itbis: prod.itbis,
          cantidad: 1,
        },
      ];
    });
  }, []);

  const cambiarCantidad = (id: string, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((i) => (i.productoId === id ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0),
    );
  };

  const { subtotal, itbis, total } = calcularTotales(carrito);
  const cambio =
    metodoPago === 'EFECTIVO' && efectivoRecibido
      ? Math.max(0, Number(efectivoRecibido) - total)
      : 0;

  const registrar = async () => {
    if (carrito.length === 0) return;
    setGuardando(true);
    await guardarVentaOffline({
      empresaId: '',
      clienteNombre: clienteNombre || undefined,
      items: carrito.map((i) => ({
        productoId: i.productoId,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precio: i.precio,
        itbis: i.itbis,
        subtotal: i.precio * i.cantidad,
        total: i.precio * i.cantidad * (1 + i.itbis / 100),
      })),
      subtotal,
      itbis,
      total,
      metodoPago,
      efectivoRecibido: metodoPago === 'EFECTIVO' ? Number(efectivoRecibido) : undefined,
      cambio: metodoPago === 'EFECTIVO' ? cambio : undefined,
    });
    setCarrito([]);
    setClienteNombre('');
    setEfectivoRecibido('');
    setGuardando(false);
    setExito(true);
    setTimeout(() => setExito(false), 3000);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Banner offline */}
      <div className="flex items-center gap-2 bg-amber-50 px-4 py-2.5 border-b border-amber-200">
        <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm font-medium text-amber-800">
          Modo sin conexión — Las ventas se sincronizarán cuando vuelva el internet
        </p>
        <span className="ml-auto inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
          OFFLINE
        </span>
      </div>

      {exito && (
        <div className="mx-4 mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          Venta guardada. Se sincronizará cuando haya conexión.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Panel izquierdo — Productos */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute inset-y-0 left-3 flex h-full w-4 items-center text-slate-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto por nombre o SKU..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {!productos ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Cargando catálogo local...
            </div>
          ) : productos.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              {busqueda
                ? 'Sin resultados.'
                : 'No hay productos en caché. Sincroniza el catálogo primero.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
              {productos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => agregarAlCarrito(p)}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <p className="truncate text-sm font-semibold text-slate-900">{p.nombre}</p>
                  {p.sku && <p className="text-xs text-slate-400">{p.sku}</p>}
                  <p className="mt-1 text-sm font-bold text-indigo-700">
                    RD${p.precio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </p>
                  {p.itbis > 0 && <p className="text-xs text-slate-400">+ ITBIS</p>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho — Carrito */}
        <div className="flex w-80 shrink-0 flex-col rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <ShoppingCart className="h-4 w-4 text-slate-600" />
            <span className="font-semibold text-slate-900">Carrito</span>
            <span className="ml-auto rounded-full bg-indigo-100 px-2 text-xs font-bold text-indigo-700">
              {carrito.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {carrito.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Agrega productos al carrito</p>
            ) : (
              carrito.map((item) => (
                <div
                  key={item.productoId}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-2"
                >
                  <p className="text-xs font-medium text-slate-900 truncate">{item.nombre}</p>
                  <p className="text-xs text-slate-500">
                    RD${item.precio.toLocaleString('es-DO', { minimumFractionDigits: 2 })} c/u
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      onClick={() => cambiarCantidad(item.productoId, -1)}
                      className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 hover:bg-red-100"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(item.productoId, 1)}
                      className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 hover:bg-emerald-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <span className="ml-auto text-xs font-semibold text-slate-700">
                      RD$
                      {(item.precio * item.cantidad).toLocaleString('es-DO', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <button onClick={() => cambiarCantidad(item.productoId, -item.cantidad)}>
                      <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totales y cobro */}
          <div className="border-t border-slate-100 p-3 space-y-3">
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>RD${subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>ITBIS</span>
                <span>RD${itbis.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900">
                <span>Total</span>
                <span>RD${total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <input
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              placeholder="Nombre del cliente (opcional)"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            />

            <div className="flex gap-2">
              {(['EFECTIVO', 'TARJETA'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetodoPago(m)}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                    metodoPago === m
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m === 'EFECTIVO' ? 'Efectivo' : 'Tarjeta'}
                </button>
              ))}
            </div>

            {metodoPago === 'EFECTIVO' && (
              <div className="space-y-1">
                <input
                  type="number"
                  value={efectivoRecibido}
                  onChange={(e) => setEfectivoRecibido(e.target.value)}
                  placeholder="Efectivo recibido"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
                {efectivoRecibido && (
                  <p className="text-xs font-medium text-emerald-700">
                    Cambio: RD${cambio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={registrar}
              disabled={carrito.length === 0 || guardando}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Registrar venta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
