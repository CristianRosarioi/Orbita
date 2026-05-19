import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Wrench, Plus } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buttonVariants } from '@/components/ui/button';
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

const TODOS_ESTADOS = [
  'RECIBIDO',
  'EN_DIAGNOSTICO',
  'ESPERANDO_REPUESTOS',
  'EN_REPARACION',
  'LISTO',
  'ENTREGADO',
  'CANCELADO',
];

interface SearchParams {
  estado?: string;
}

export default async function TallerOrdenesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_TALLER.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { estado } = await searchParams;

  const ordenes = await prisma.ordenTrabajo.findMany({
    where: {
      empresaId: sesion.empresaActivaId,
      deletedAt: null,
      ...(estado ? { estado: estado as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      numero: true,
      clienteNombre: true,
      vehiculoMarca: true,
      vehiculoModelo: true,
      vehiculoPlaca: true,
      estado: true,
      tecnico: true,
      total: true,
      fechaPromesa: true,
      fechaRecepcion: true,
    },
  });

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Órdenes de trabajo
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''}
            {estado ? ` · ${ESTADO_LABELS[estado] ?? estado}` : ''}
          </p>
        </div>
        <Link href="/taller/ordenes/nueva" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva orden
        </Link>
      </div>

      {/* Filtros de estado */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/taller/ordenes"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !estado
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos
        </Link>
        {TODOS_ESTADOS.map((e) => (
          <Link
            key={e}
            href={`/taller/ordenes?estado=${e}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              estado === e
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {ESTADO_LABELS[e]}
          </Link>
        ))}
      </div>

      {ordenes.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-16 text-center text-slate-500">
          <Wrench className="mx-auto h-10 w-10 mb-3 text-slate-300" />
          <p className="font-medium">Sin órdenes de trabajo</p>
          <p className="text-sm mt-1">Crea la primera orden para un vehículo.</p>
          <Link href="/taller/ordenes/nueva" className={buttonVariants() + ' mt-4'}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva orden
          </Link>
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">#</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Placa</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Vehículo</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Técnico</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Promesa</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">#{o.numero}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{o.vehiculoPlaca}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {o.vehiculoMarca} {o.vehiculoModelo}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{o.clienteNombre}</td>
                  <td className="px-4 py-3 text-slate-500">{o.tecnico ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                    {o.fechaPromesa
                      ? new Date(o.fechaPromesa).toLocaleDateString('es-DO')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    RD$ {Number(o.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={ESTADO_COLORS[o.estado]}>{ESTADO_LABELS[o.estado]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/taller/ordenes/${o.id}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Ver
                    </Link>
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
