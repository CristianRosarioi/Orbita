'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Clock } from 'lucide-react';

interface Pago {
  id: string;
  mes: string;
  monto: number;
  estado: string;
  pagadoEn: string | null;
}

interface Contrato {
  id: string;
  inquilinoNombre: string;
  inquilinoTelefono: string | null;
  inquilinoCedula: string | null;
  montoMensual: number;
  deposito: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  notas: string | null;
  propiedad: { codigo: string; nombre: string; tipo: string; ciudad: string };
  pagos: Pago[];
}

export default function DetalleContratoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [cargando, setCargando] = useState(true);
  const [registrandoPago, setRegistrandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState('');

  const cargar = useCallback(() => {
    fetch(`/api/inmobiliaria/contratos/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setContrato(d.data); })
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function registrarPago(mes: string) {
    if (!contrato) return;
    setErrorPago('');
    setRegistrandoPago(true);
    try {
      const res = await fetch(`/api/inmobiliaria/contratos/${id}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes, monto: contrato.montoMensual }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorPago(data.error?.message ?? 'Error'); return; }
      cargar();
    } finally {
      setRegistrandoPago(false);
    }
  }

  if (cargando) return <div className="p-6 text-slate-400">Cargando...</div>;
  if (!contrato) return <div className="p-6 text-red-500">Contrato no encontrado</div>;

  const formatFecha = (s: string) => new Date(s).toLocaleDateString('es-DO');

  const mesActual = new Date().toISOString().substring(0, 7);
  const pagoMesActual = contrato.pagos.find((p) => p.mes === mesActual);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="mb-3 text-sm text-slate-500 hover:text-slate-700">← Volver</button>
        <h1 className="text-2xl font-bold text-slate-900">{contrato.inquilinoNombre}</h1>
        <p className="text-sm text-slate-500">{contrato.propiedad.codigo} — {contrato.propiedad.nombre}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 mb-1">Monto mensual</p>
          <p className="font-bold text-slate-900">RD$ {Number(contrato.montoMensual).toLocaleString('es-DO')}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 mb-1">Depósito</p>
          <p className="font-bold text-slate-900">RD$ {Number(contrato.deposito).toLocaleString('es-DO')}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 mb-1">Inicio</p>
          <p className="font-bold text-slate-900">{formatFecha(contrato.fechaInicio)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 mb-1">Vence</p>
          <p className="font-bold text-slate-900">{formatFecha(contrato.fechaFin)}</p>
        </div>
      </div>

      {/* Pago del mes actual */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Mes actual ({mesActual})</h2>
        {errorPago && <p className="mb-2 text-sm text-red-600">{errorPago}</p>}
        {pagoMesActual?.estado === 'PAGADO' ? (
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              Pagado el {pagoMesActual.pagadoEn ? formatFecha(pagoMesActual.pagadoEn) : ''}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Pendiente de pago</span>
            </div>
            <button
              onClick={() => registrarPago(mesActual)}
              disabled={registrandoPago}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {registrandoPago ? 'Registrando...' : `Registrar pago RD$ ${Number(contrato.montoMensual).toLocaleString('es-DO')}`}
            </button>
          </div>
        )}
      </div>

      {/* Historial de pagos */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Historial de pagos</h2>
        {contrato.pagos.length === 0 ? (
          <p className="text-sm text-slate-400">Sin pagos registrados</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mes</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Fecha pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contrato.pagos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.mes}</td>
                    <td className="px-4 py-3 text-right text-slate-700">RD$ {Number(p.monto).toLocaleString('es-DO')}</td>
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
    </div>
  );
}
