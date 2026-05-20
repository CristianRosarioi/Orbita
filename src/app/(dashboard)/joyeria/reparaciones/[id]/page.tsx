'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, FileText } from 'lucide-react';

const ESTADOS = ['RECIBIDA', 'EN_PROCESO', 'LISTA', 'ENTREGADA'];

const ESTADO_CONFIG: Record<string, { label: string; clase: string }> = {
  RECIBIDA: { label: 'Recibida', clase: 'bg-slate-100 text-slate-700' },
  EN_PROCESO: { label: 'En proceso', clase: 'bg-blue-100 text-blue-800' },
  LISTA: { label: 'Lista para entregar', clase: 'bg-emerald-100 text-emerald-800' },
  ENTREGADA: { label: 'Entregada', clase: 'bg-slate-100 text-slate-500' },
};

interface Reparacion {
  id: string;
  clienteNombre: string;
  descripcion: string;
  diagnostico: string | null;
  presupuesto: number | null;
  costoFinal: number | null;
  estado: string;
  fechaPromesa: string | null;
  fechaEntrega: string | null;
  facturaId: string | null;
  pieza: { codigo: string; nombre: string; material: string } | null;
}

export default function DetalleReparacionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reparacion, setReparacion] = useState<Reparacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [facturando, setFacturando] = useState(false);
  const [error, setError] = useState('');
  const [costoFinal, setCostoFinal] = useState('');

  const cargar = useCallback(() => {
    fetch(`/api/joyeria/reparaciones/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setReparacion(d.data);
          setCostoFinal(d.data.costoFinal ? String(Number(d.data.costoFinal)) : '');
        }
      })
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cambiarEstado(nuevoEstado: string) {
    setError('');
    setActualizando(true);
    const body: Record<string, unknown> = { estado: nuevoEstado };
    if (nuevoEstado === 'LISTA' && costoFinal) body.costoFinal = Number(costoFinal);
    try {
      const res = await fetch(`/api/joyeria/reparaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message ?? 'Error'); return; }
      cargar();
    } finally {
      setActualizando(false);
    }
  }

  async function facturar() {
    setError('');
    setFacturando(true);
    try {
      const res = await fetch(`/api/joyeria/reparaciones/${id}/facturar`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message ?? 'Error al facturar'); return; }
      cargar();
    } finally {
      setFacturando(false);
    }
  }

  if (cargando) return <div className="p-6 text-slate-400">Cargando...</div>;
  if (!reparacion) return <div className="p-6 text-red-500">Reparación no encontrada</div>;

  const estadoCfg = ESTADO_CONFIG[reparacion.estado] ?? ESTADO_CONFIG.RECIBIDA;
  const idxEstado = ESTADOS.indexOf(reparacion.estado);
  const formatFecha = (s: string) => new Date(s).toLocaleDateString('es-DO');

  return (
    <div className="p-6 max-w-2xl">
      <button onClick={() => router.back()} className="mb-4 text-sm text-slate-500 hover:text-slate-700">← Volver</button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{reparacion.clienteNombre}</h1>
          {reparacion.pieza && (
            <p className="text-sm text-slate-500">{reparacion.pieza.codigo} — {reparacion.pieza.nombre}</p>
          )}
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${estadoCfg.clase}`}>
          {estadoCfg.label}
        </span>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Progreso */}
      <div className="mb-6 flex items-center gap-2">
        {ESTADOS.map((est, i) => (
          <div key={est} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= idxEstado ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {i < idxEstado ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            {i < ESTADOS.length - 1 && <div className={`h-0.5 w-10 ${i < idxEstado ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase">Descripción del trabajo</p>
          <p className="mt-1 text-slate-900">{reparacion.descripcion}</p>
        </div>
        {reparacion.diagnostico && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Diagnóstico</p>
            <p className="mt-1 text-slate-700">{reparacion.diagnostico}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Presupuesto</p>
            <p className="mt-1 font-semibold text-slate-900">
              {reparacion.presupuesto != null ? `RD$ ${Number(reparacion.presupuesto).toLocaleString('es-DO')}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Costo final</p>
            <p className="mt-1 font-semibold text-slate-900">
              {reparacion.costoFinal != null ? `RD$ ${Number(reparacion.costoFinal).toLocaleString('es-DO')}` : '—'}
            </p>
          </div>
          {reparacion.fechaPromesa && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Fecha promesa</p>
              <p className="mt-1 text-slate-700">{formatFecha(reparacion.fechaPromesa)}</p>
            </div>
          )}
          {reparacion.fechaEntrega && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Fecha entrega</p>
              <p className="mt-1 text-slate-700">{formatFecha(reparacion.fechaEntrega)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Acciones de estado */}
      {reparacion.estado !== 'ENTREGADA' && (
        <div className="space-y-3">
          {reparacion.estado === 'RECIBIDA' && (
            <button onClick={() => cambiarEstado('EN_PROCESO')} disabled={actualizando}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {actualizando ? 'Actualizando...' : 'Marcar como En proceso'}
            </button>
          )}
          {reparacion.estado === 'EN_PROCESO' && (
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Costo final (RD$) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costoFinal}
                  onChange={(e) => setCostoFinal(e.target.value)}
                  placeholder="800"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <button onClick={() => cambiarEstado('LISTA')} disabled={actualizando || !costoFinal}
                className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {actualizando ? 'Actualizando...' : 'Marcar como Lista'}
              </button>
            </div>
          )}
          {reparacion.estado === 'LISTA' && (
            <div className="space-y-2">
              {!reparacion.facturaId ? (
                <button onClick={facturar} disabled={facturando}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  <FileText className="h-4 w-4" />
                  {facturando ? 'Generando factura...' : 'Facturar y marcar como entregada'}
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-800">Factura generada</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
