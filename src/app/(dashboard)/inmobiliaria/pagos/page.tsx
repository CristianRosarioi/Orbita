'use client';

import { useState, useEffect, useCallback } from 'react';

const MESES = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const MESES_LABEL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

interface Pago {
  id: string;
  mes: string;
  monto: number;
  estado: string;
  pagadoEn: string | null;
  contrato: {
    inquilinoNombre: string;
    montoMensual: number;
    propiedad: { codigo: string; nombre: string };
  };
}

export default function PagosPage() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(String(hoy.getMonth() + 1).padStart(2, '0'));
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [totalCobrado, setTotalCobrado] = useState(0);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    const params = new URLSearchParams({ mes: `${anio}-${mes}`, limit: '100' });
    if (estadoFiltro) params.set('estado', estadoFiltro);
    fetch(`/api/inmobiliaria/pagos?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPagos(d.data);
          setTotalCobrado(d.meta?.totalCobrado ?? 0);
        }
      })
      .finally(() => setCargando(false));
  }, [anio, mes, estadoFiltro]);

  useEffect(() => { cargar(); }, [cargar]);

  const formatFecha = (s: string) => new Date(s).toLocaleDateString('es-DO');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pagos de renta</h1>
        <p className="text-sm text-slate-500">
          Total cobrado: <strong className="text-emerald-700">RD$ {totalCobrado.toLocaleString('es-DO')}</strong>
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-3">
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {MESES.map((m, i) => (
            <option key={m} value={m}>{MESES_LABEL[i]}</option>
          ))}
        </select>
        <select
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {[2024, 2025, 2026, 2027].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="PAGADO">Pagado</option>
          <option value="ATRASADO">Atrasado</option>
        </select>
      </div>

      {cargando ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : pagos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="text-slate-400">No hay pagos para este período</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Propiedad</th>
                <th className="px-4 py-3 text-left">Inquilino</th>
                <th className="px-4 py-3 text-left">Mes</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fecha pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{p.contrato.propiedad.codigo}</p>
                    <p className="text-xs text-slate-400">{p.contrato.propiedad.nombre}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{p.contrato.inquilinoNombre}</td>
                  <td className="px-4 py-3 text-slate-500">{p.mes}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    RD$ {Number(p.monto).toLocaleString('es-DO')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.estado === 'PAGADO' ? 'bg-emerald-100 text-emerald-800' :
                      p.estado === 'ATRASADO' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.pagadoEn ? formatFecha(p.pagadoEn) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
