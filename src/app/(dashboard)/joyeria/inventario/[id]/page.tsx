'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Gem } from 'lucide-react';

const MATERIAL_LABEL: Record<string, string> = {
  ORO_18K: 'Oro 18K',
  ORO_14K: 'Oro 14K',
  ORO_10K: 'Oro 10K',
  PLATA_925: 'Plata 925',
  PLATINO: 'Platino',
  OTRO: 'Otro',
};

const ESTADO_CONFIG: Record<string, { label: string; clase: string }> = {
  EN_VITRINA: { label: 'En vitrina', clase: 'bg-emerald-100 text-emerald-800' },
  VENDIDA: { label: 'Vendida', clase: 'bg-slate-100 text-slate-600' },
  EN_REPARACION: { label: 'En reparación', clase: 'bg-blue-100 text-blue-800' },
  RESERVADA: { label: 'Reservada', clase: 'bg-purple-100 text-purple-800' },
  CONSIGNACION: { label: 'Consignación', clase: 'bg-orange-100 text-orange-800' },
};

interface PiezaDetalle {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  material: string;
  pesoGramos: number | null;
  quilates: number | null;
  estado: string;
  precioCompra: number | null;
  precioVenta: number;
  descripcion: string | null;
  notas: string | null;
  cliente: { nombre: string } | null;
  reparaciones: { id: string; descripcion: string; estado: string; createdAt: string }[];
}

export default function DetallePiezaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pieza, setPieza] = useState<PiezaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`/api/joyeria/inventario/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPieza(d.data);
      })
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <div className="p-6 text-slate-400">Cargando...</div>;
  if (!pieza) return <div className="p-6 text-red-500">Pieza no encontrada</div>;

  const estadoCfg = ESTADO_CONFIG[pieza.estado] ?? ESTADO_CONFIG.EN_VITRINA;

  return (
    <div className="p-6 max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-slate-500 hover:text-slate-700"
      >
        ← Volver
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-50">
            <Gem className="h-7 w-7 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-400">{pieza.codigo}</p>
            <h1 className="text-2xl font-bold text-slate-900">{pieza.nombre}</h1>
            <p className="text-sm text-slate-500">
              {pieza.tipo} · {MATERIAL_LABEL[pieza.material]}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${estadoCfg.clase}`}>
          {estadoCfg.label}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {pieza.pesoGramos != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xl font-bold text-slate-900">{Number(pieza.pesoGramos)}g</p>
            <p className="text-xs text-slate-500">Peso</p>
          </div>
        )}
        {pieza.quilates != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xl font-bold text-slate-900">{Number(pieza.quilates)}ct</p>
            <p className="text-xs text-slate-500">Quilates</p>
          </div>
        )}
        {pieza.precioCompra != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-lg font-bold text-slate-900">
              RD$ {Number(pieza.precioCompra).toLocaleString('es-DO')}
            </p>
            <p className="text-xs text-slate-500">Precio compra</p>
          </div>
        )}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-center">
          <p className="text-lg font-bold text-indigo-900">
            RD$ {Number(pieza.precioVenta).toLocaleString('es-DO')}
          </p>
          <p className="text-xs text-indigo-600">Precio venta</p>
        </div>
      </div>

      {pieza.descripcion && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">{pieza.descripcion}</p>
        </div>
      )}

      {pieza.cliente && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          En consignación de: <strong>{pieza.cliente.nombre}</strong>
        </div>
      )}

      {pieza.reparaciones.length > 0 && (
        <div>
          <h2 className="mb-3 font-semibold text-slate-900">Historial de reparaciones</h2>
          <div className="space-y-2">
            {pieza.reparaciones.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-sm text-slate-700">{r.descripcion}</p>
                <span className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString('es-DO')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
