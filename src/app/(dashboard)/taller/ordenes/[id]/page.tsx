import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import OrdenAcciones from './_components/orden-acciones';
import AgregarItem from './_components/agregar-item';

const INDUSTRIAS_TALLER = ['TALLER_MECANICO', 'CARWASH', 'REPUESTOS'];

const ESTADO_LABELS: Record<string, string> = {
  RECIBIDO: 'Recibido',
  EN_DIAGNOSTICO: 'En diagnóstico',
  ESPERANDO_REPUESTOS: 'Esperando repuestos',
  EN_REPARACION: 'En reparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const ESTADO_COLORS: Record<string, string> = {
  RECIBIDO: 'bg-slate-100 text-slate-600',
  EN_DIAGNOSTICO: 'bg-blue-100 text-blue-700',
  ESPERANDO_REPUESTOS: 'bg-amber-100 text-amber-700',
  EN_REPARACION: 'bg-orange-100 text-orange-700',
  LISTO: 'bg-emerald-100 text-emerald-700',
  ENTREGADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-700',
};

const TIMELINE = [
  'RECIBIDO',
  'EN_DIAGNOSTICO',
  'ESPERANDO_REPUESTOS',
  'EN_REPARACION',
  'LISTO',
  'ENTREGADO',
];

const fmt = (n: unknown) =>
  `RD$ ${Number(n).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

export default async function OrdenDetallesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { id } = await params;
  const orden = await prisma.ordenTrabajo.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  });

  if (!orden) notFound();

  const estadoIdx = TIMELINE.indexOf(orden.estado);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/taller/ordenes"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a órdenes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Orden #{orden.numero}
            </h1>
            <Badge className={ESTADO_COLORS[orden.estado]}>{ESTADO_LABELS[orden.estado]}</Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            <span className="font-mono font-bold text-slate-800">{orden.vehiculoPlaca}</span>
            {' · '}
            {orden.vehiculoMarca} {orden.vehiculoModelo}
            {orden.vehiculoAnio ? ` ${orden.vehiculoAnio}` : ''}
            {' · '}
            {orden.clienteNombre}
          </p>
        </div>
        <OrdenAcciones orden={{ id, estado: orden.estado, facturaId: orden.facturaId }} />
      </div>

      {/* Timeline */}
      {orden.estado !== 'CANCELADO' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-0">
            {TIMELINE.map((e, idx) => (
              <div key={e} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`h-3 w-3 rounded-full border-2 ${
                      idx <= estadoIdx
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                  <span className={`text-[10px] whitespace-nowrap ${idx <= estadoIdx ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                    {ESTADO_LABELS[e].split(' ')[0]}
                  </span>
                </div>
                {idx < TIMELINE.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${idx < estadoIdx ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Info vehículo */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">Información del vehículo</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><span className="text-slate-500">Placa:</span> <span className="font-mono font-bold ml-2">{orden.vehiculoPlaca}</span></div>
              <div><span className="text-slate-500">Color:</span> <span className="ml-2">{orden.vehiculoColor ?? '—'}</span></div>
              <div><span className="text-slate-500">Marca/Modelo:</span> <span className="ml-2">{orden.vehiculoMarca} {orden.vehiculoModelo}</span></div>
              <div><span className="text-slate-500">Año:</span> <span className="ml-2">{orden.vehiculoAnio ?? '—'}</span></div>
              <div><span className="text-slate-500">Kilometraje:</span> <span className="ml-2">{orden.kilometraje ? `${orden.kilometraje.toLocaleString()} km` : '—'}</span></div>
              <div><span className="text-slate-500">Técnico:</span> <span className="ml-2">{orden.tecnico ?? '—'}</span></div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Descripción de la falla</p>
              <p className="text-sm text-slate-800">{orden.descripcionFalla}</p>
            </div>
            {orden.diagnostico && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Diagnóstico</p>
                <p className="text-sm text-slate-800">{orden.diagnostico}</p>
              </div>
            )}
            {orden.trabajoRealizado && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Trabajo realizado</p>
                <p className="text-sm text-slate-800">{orden.trabajoRealizado}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Servicios y repuestos</h2>
              {orden.estado !== 'ENTREGADO' && orden.estado !== 'CANCELADO' && (
                <AgregarItem ordenId={id} />
              )}
            </div>
            {orden.items.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">
                Sin ítems. Agrega servicios o repuestos.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">Tipo</th>
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">Descripción</th>
                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">Cant.</th>
                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">Precio</th>
                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">ITBIS</th>
                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orden.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${item.tipo === 'SERVICIO' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {item.tipo === 'SERVICIO' ? 'Servicio' : 'Repuesto'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{item.descripcion}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{Number(item.cantidad)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{fmt(item.precioUnitario)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500">{fmt(item.itbisMonto)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-900">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={5} className="px-4 py-2.5 text-right font-semibold text-slate-700">Total</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">{fmt(orden.total)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">Cliente</h2>
            <p className="text-sm font-medium text-slate-800">{orden.clienteNombre}</p>
            {orden.clienteTelefono && (
              <p className="text-sm text-slate-500">{orden.clienteTelefono}</p>
            )}
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">Fechas</h2>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Recepción</span>
                <span>{new Date(orden.fechaRecepcion).toLocaleDateString('es-DO')}</span>
              </div>
              {orden.fechaPromesa && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Promesa</span>
                  <span>{new Date(orden.fechaPromesa).toLocaleDateString('es-DO')}</span>
                </div>
              )}
              {orden.fechaEntrega && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Entrega</span>
                  <span className="text-emerald-700 font-medium">{new Date(orden.fechaEntrega).toLocaleDateString('es-DO')}</span>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-2">
            <h2 className="font-semibold text-slate-900">Totales</h2>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmt(orden.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">ITBIS (18%)</span><span>{fmt(orden.itbis)}</span></div>
              <div className="flex justify-between font-bold border-t border-slate-100 pt-1.5 mt-1.5"><span>Total</span><span>{fmt(orden.total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
