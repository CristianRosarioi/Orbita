import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Car } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';

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

const fmt = (n: unknown) =>
  `RD$ ${Number(n).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

interface SearchParams {
  placa?: string;
}

export default async function HistorialPlacaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { placa } = await searchParams;

  const ordenes =
    placa && placa.length >= 2
      ? await prisma.ordenTrabajo.findMany({
          where: {
            empresaId: sesion.empresaActivaId,
            deletedAt: null,
            vehiculoPlaca: { contains: placa.toUpperCase(), mode: 'insensitive' },
          },
          orderBy: { fechaRecepcion: 'desc' },
          include: { items: { select: { tipo: true, descripcion: true } } },
        })
      : null;

  const vehiculo =
    ordenes && ordenes.length > 0
      ? `${ordenes[0].vehiculoMarca} ${ordenes[0].vehiculoModelo}${ordenes[0].vehiculoAnio ? ` ${ordenes[0].vehiculoAnio}` : ''}`
      : null;

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Historial por placa</h1>
        <p className="text-slate-500 text-sm mt-1">
          Busca todas las órdenes de trabajo de un vehículo.
        </p>
      </div>

      <form method="GET" className="flex gap-3 items-end">
        <div className="space-y-1.5 flex-1 max-w-xs">
          <label className="text-xs font-medium text-slate-500">Número de placa</label>
          <input
            name="placa"
            defaultValue={placa ?? ''}
            placeholder="Ej: A123456"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700"
        >
          Buscar
        </button>
      </form>

      {placa && ordenes !== null && ordenes.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 py-14 text-center text-slate-500">
          <Car className="mx-auto h-10 w-10 mb-3 text-slate-300" />
          <p className="font-medium">Sin resultados para &ldquo;{placa}&rdquo;</p>
          <p className="text-sm mt-1">Verifica la placa e intenta de nuevo.</p>
        </div>
      )}

      {ordenes && ordenes.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Vehículo</p>
            <p className="font-bold text-slate-900 text-lg">{placa?.toUpperCase()}</p>
            <p className="text-sm text-slate-600">{vehiculo}</p>
            <p className="text-sm text-slate-500 mt-0.5">{ordenes.length} visita{ordenes.length !== 1 ? 's' : ''} registrada{ordenes.length !== 1 ? 's' : ''}</p>
          </div>

          {ordenes.map((o) => (
            <div key={o.id} className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700">Orden #{o.numero}</span>
                    <Badge className={ESTADO_COLORS[o.estado]}>{ESTADO_LABELS[o.estado]}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recibido: {new Date(o.fechaRecepcion).toLocaleDateString('es-DO')}
                    {o.fechaEntrega && ` · Entregado: ${new Date(o.fechaEntrega).toLocaleDateString('es-DO')}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{fmt(o.total)}</p>
                  <Link href={`/taller/ordenes/${o.id}`} className="text-xs text-indigo-600 hover:underline">
                    Ver detalle
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Falla reportada</p>
                <p className="text-sm text-slate-700">{o.descripcionFalla}</p>
              </div>
              {o.items.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Servicios/Repuestos</p>
                  <ul className="text-sm text-slate-600 space-y-0.5">
                    {o.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className={`text-xs px-1 rounded ${item.tipo === 'SERVICIO' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                          {item.tipo === 'SERVICIO' ? 'S' : 'R'}
                        </span>
                        {item.descripcion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
