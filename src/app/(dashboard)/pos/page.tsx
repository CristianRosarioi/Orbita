'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertTriangle, X, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductoCardPOS } from '@/components/shared/producto-card-pos';
import { CarritoItem } from '@/components/shared/carrito-item';
import { CobrarPanel } from '@/components/shared/cobro-panel';
import { ExitoVentaModal } from '@/components/shared/exito-venta-modal';
import { generarTicketPOS } from '@/lib/ticket-pdf';

interface Producto {
  id: string;
  nombre: string;
  sku: string | null;
  codigoBarras: string | null;
  precioVenta: number;
  stockActual: number;
  tipo: string;
  itbisAplicable: boolean;
  itbisIncluidoEnPrecio: boolean;
  categoria: { id: string; nombre: string } | null;
}

interface ItemCarrito {
  productoId: string;
  nombre: string;
  sku: string | null;
  cantidad: number;
  precioUnitario: number;
  itbisPorcentaje: number;
}

interface SesionCaja {
  id: string;
  estado: string;
  montoApertura: number;
  fechaApertura: string;
}

interface ResultadoVenta {
  facturaId: string;
  numero: string;
  total: number;
  montoRecibido?: number;
}

const ITBIS_RATE = 18;

function calcularTotales(items: ItemCarrito[], descuento: number) {
  const subtotal = items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
  const itbis = items.reduce(
    (s, i) => s + i.cantidad * i.precioUnitario * (i.itbisPorcentaje / 100),
    0,
  );
  const total = Math.max(0, subtotal + itbis - descuento);
  return { subtotal, itbis, total };
}

export default function POSPage() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [sesion, setSesion] = useState<SesionCaja | null | undefined>(undefined);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODOS');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [descuento, setDescuento] = useState(0);
  const [cargandoCobro, setCargandoCobro] = useState(false);
  const [resultado, setResultado] = useState<ResultadoVenta | null>(null);
  const [empresa, setEmpresa] = useState<{
    nombre: string;
    nombreComercial: string | null;
    telefono: string | null;
    direccion: string | null;
    modoFiscal: string;
  } | null>(null);

  // Cargar sesión de caja
  useEffect(() => {
    fetch('/api/caja/sesion-activa')
      .then((r) => r.json())
      .then((d) => setSesion(d.data))
      .catch(() => setSesion(null));
  }, []);

  // Cargar productos
  useEffect(() => {
    fetch('/api/productos?limit=200&activo=true')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProductos(d.data.items ?? d.data ?? []);
      });
  }, []);

  // Cargar empresa para el ticket
  useEffect(() => {
    fetch('/api/empresas/activa')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEmpresa(d.data);
      })
      .catch(() => {});
  }, []);

  // Foco automático en el input de búsqueda
  useEffect(() => {
    searchRef.current?.focus();
  }, [resultado]);

  const categorias = [
    'TODOS',
    ...Array.from(new Set(productos.map((p) => p.categoria?.nombre ?? 'Sin categoría'))),
  ];

  const productosFiltrados = productos.filter((p) => {
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.sku?.toLowerCase().includes(q) ?? false) ||
      (p.codigoBarras?.includes(q) ?? false);
    const matchCategoria =
      categoriaFiltro === 'TODOS' || (p.categoria?.nombre ?? 'Sin categoría') === categoriaFiltro;
    return matchBusqueda && matchCategoria;
  });

  const agregarAlCarrito = useCallback(
    (productoId: string) => {
      const producto = productos.find((p) => p.id === productoId);
      if (!producto) return;

      setCarrito((prev) => {
        const existente = prev.find((i) => i.productoId === productoId);
        if (existente) {
          return prev.map((i) =>
            i.productoId === productoId ? { ...i, cantidad: i.cantidad + 1 } : i,
          );
        }
        return [
          ...prev,
          {
            productoId: producto.id,
            nombre: producto.nombre,
            sku: producto.sku,
            cantidad: 1,
            precioUnitario: Number(producto.precioVenta),
            itbisPorcentaje: producto.itbisAplicable ? ITBIS_RATE : 0,
          },
        ];
      });
      setBusqueda('');
      searchRef.current?.focus();
    },
    [productos],
  );

  // Al presionar Enter en el buscador con un resultado exacto (para lector de barras)
  const handleBusquedaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const exacto = productos.find(
      (p) =>
        p.codigoBarras === busqueda ||
        p.sku === busqueda ||
        p.nombre.toLowerCase() === busqueda.toLowerCase(),
    );
    if (exacto) {
      agregarAlCarrito(exacto.id);
    }
  };

  const incrementarItem = (id: string) => {
    setCarrito((prev) =>
      prev.map((i) => (i.productoId === id ? { ...i, cantidad: i.cantidad + 1 } : i)),
    );
  };

  const decrementarItem = (id: string) => {
    setCarrito((prev) =>
      prev
        .map((i) => (i.productoId === id ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0),
    );
  };

  const eliminarItem = (id: string) => {
    setCarrito((prev) => prev.filter((i) => i.productoId !== id));
  };

  const { subtotal, itbis, total } = calcularTotales(carrito, descuento);

  const handleCobrar = async (
    metodo: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA',
    montoRecibido?: number,
  ) => {
    if (!sesion || carrito.length === 0) return;
    setCargandoCobro(true);

    try {
      // 1. Crear factura
      const bodyFactura = {
        clienteNombre: 'Consumidor Final',
        metodoPago: metodo,
        sesionCajaId: sesion.id,
        descuento: Number(descuento ?? 0),
        items: carrito.map((i) => ({
          productoId: i.productoId,
          productoNombre: i.nombre,
          productoSku: i.sku ?? undefined,
          cantidad: Number(i.cantidad),
          precioUnitario: Number(i.precioUnitario),
          itbisPorcentaje: Number(i.itbisPorcentaje),
          descuento: 0,
        })),
      };

      const respFactura = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyFactura),
      });
      const dataFactura = await respFactura.json();
      if (!dataFactura.success)
        throw new Error(dataFactura.error?.message ?? 'Error al crear factura');

      const facturaId = dataFactura.data.id;

      // 2. Emitir factura inmediatamente
      await fetch(`/api/facturas/${facturaId}/emitir`, { method: 'POST' });

      // 3. Registrar pago
      await fetch(`/api/facturas/${facturaId}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: total, metodoPago: metodo }),
      });

      setResultado({ facturaId, numero: dataFactura.data.numero, total, montoRecibido });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al procesar la venta');
    } finally {
      setCargandoCobro(false);
    }
  };

  const imprimirTicket = async () => {
    if (!resultado || !empresa) return;
    const respFactura = await fetch(`/api/facturas/${resultado.facturaId}`);
    const dataFactura = await respFactura.json();
    if (!dataFactura.success) return;

    const f = dataFactura.data;
    const blob = generarTicketPOS(
      {
        numero: f.numero,
        fechaEmision: f.fechaEmision,
        metodoPago: f.metodoPago,
        subtotal: Number(f.subtotal),
        itbis: Number(f.itbis),
        descuento: Number(f.descuento),
        total: Number(f.total),
        clienteNombre: f.clienteNombre,
        montoRecibido: resultado.montoRecibido,
        items: f.items.map(
          (i: {
            productoNombre: string;
            cantidad: string | number;
            precioUnitario: string | number;
            total: string | number;
          }) => ({
            productoNombre: i.productoNombre,
            cantidad: Number(i.cantidad),
            precioUnitario: Number(i.precioUnitario),
            total: Number(i.total),
          }),
        ),
      },
      empresa,
    );

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const nuevaVenta = () => {
    setCarrito([]);
    setDescuento(0);
    setResultado(null);
    searchRef.current?.focus();
  };

  if (sesion === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ---- Columna izquierda: catálogo ---- */}
      <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden">
        {/* Banner si no hay caja abierta */}
        {!sesion && (
          <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">
                No tienes una caja abierta para este turno.
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => router.push('/pos/abrir-caja')}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            >
              Abrir caja
            </Button>
          </div>
        )}

        {/* Header buscador */}
        <div className="p-4 pb-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                ref={searchRef}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={handleBusquedaKeyDown}
                placeholder="Buscar por nombre, SKU o código de barras…"
                className="pl-9 pr-9"
                autoFocus
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda('');
                    searchRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {sesion && (
              <Link
                href="/pos/cierre"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar caja
              </Link>
            )}
          </div>

          {/* Tabs de categorías */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaFiltro(cat)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoriaFiltro === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          {productosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {productosFiltrados.map((p) => (
                <ProductoCardPOS
                  key={p.id}
                  id={p.id}
                  nombre={p.nombre}
                  sku={p.sku}
                  precioVenta={p.precioVenta}
                  stockActual={p.stockActual}
                  tipo={p.tipo}
                  onAgregar={agregarAlCarrito}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---- Columna derecha: carrito y cobro ---- */}
      <div className="w-80 lg:w-96 flex flex-col bg-white overflow-hidden">
        {/* Header carrito */}
        <div className="p-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Carrito</h2>
          {carrito.length > 0 && (
            <button
              type="button"
              onClick={() => setCarrito([])}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Limpiar todo
            </button>
          )}
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto px-4">
          {carrito.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-300">
              <p className="text-sm text-center">
                Agrega productos
                <br />
                desde el catálogo
              </p>
            </div>
          ) : (
            <div className="py-2">
              {carrito.map((item) => (
                <CarritoItem
                  key={item.productoId}
                  id={item.productoId}
                  nombre={item.nombre}
                  cantidad={item.cantidad}
                  precioUnitario={item.precioUnitario}
                  subtotal={item.cantidad * item.precioUnitario}
                  onIncrementar={incrementarItem}
                  onDecrementar={decrementarItem}
                  onEliminar={eliminarItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Panel de cobro */}
        <div className="p-4 border-t border-slate-100">
          <CobrarPanel
            total={total}
            subtotal={subtotal}
            itbis={itbis}
            descuento={descuento}
            onDescuentoChange={setDescuento}
            onCobrar={handleCobrar}
            cargando={cargandoCobro}
            deshabilitado={!sesion || carrito.length === 0}
          />
        </div>
      </div>

      {/* Modal de éxito */}
      <ExitoVentaModal
        abierto={!!resultado}
        numeroFactura={resultado?.numero ?? ''}
        total={resultado?.total ?? 0}
        cambio={
          resultado?.montoRecibido
            ? Math.max(0, resultado.montoRecibido - (resultado.total ?? 0))
            : 0
        }
        onImprimir={imprimirTicket}
        onNuevaVenta={nuevaVenta}
      />
    </div>
  );
}

// Necesario para el import inline
function Package({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}
