import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Plus } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INDUSTRIAS_TIENDA_ONLINE = ['TIENDA_ONLINE'];

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  PREPARANDO: 'Preparando',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  CONFIRMADO: 'bg-blue-100 text-blue-700',
  PREPARANDO: 'bg-violet-100 text-violet-700',
  ENVIADO: 'bg-sky-100 text-sky-700',
  ENTREGADO: 'bg-emerald-100 text-emerald-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

const CANAL_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  OTRO: 'Otro',
};

const TODOS_ESTADOS = [
  'PENDIENTE',
  'CONFIRMADO',
  'PREPARANDO',
  'ENVIADO',
  'ENTREGADO',
  'CANCELADO',
];

interface SearchParams {
  estado?: string;
  canal?: string;
}

export default async function PedidosOnlinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_TIENDA_ONLINE.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { estado, canal } = await searchParams;

  const [pedidos, conteosPorEstado] = await Promise.all([
    prisma.pedidoOnline.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        deletedAt: null,
        ...(estado ? { estado: estado as never } : {}),
        ...(canal ? { canal } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        cliente: { select: { id: true, nombre: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.pedidoOnline.groupBy({
      by: ['estado'],
      where: { empresaId: sesion.empresaActivaId, deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const conteos = Object.fromEntries(conteosPorEstado.map((c) => [c.estado, c._count._all]));
  const totalActivos =
    (conteos['PENDIENTE'] ?? 0) + (conteos['CONFIRMADO'] ?? 0) + (conteos['PREPARANDO'] ?? 0);

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pedidos Online</h1>
            <p className="text-sm text-slate-500">
              {totalActivos} pedido{totalActivos !== 1 ? 's' : ''} activo
              {totalActivos !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link
          href="/tienda-online/pedidos/nuevo"
          className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
        >
          <Plus className="h-4 w-4" />
          Nuevo pedido
        </Link>
      </div>

      {/* Stats por estado */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {TODOS_ESTADOS.map((e) => (
          <Link
            key={e}
            href={estado === e ? '/tienda-online/pedidos' : `/tienda-online/pedidos?estado=${e}`}
            className={cn(
              'rounded-xl border p-3 text-center transition-colors',
              estado === e
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50',
            )}
          >
            <p className="text-lg font-bold text-slate-900">{conteos[e] ?? 0}</p>
            <p className="text-xs text-slate-500">{ESTADO_LABELS[e]}</p>
          </Link>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/tienda-online/pedidos"
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            !estado ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          )}
        >
          Todos
        </Link>
        {TODOS_ESTADOS.map((e) => (
          <Link
            key={e}
            href={`/tienda-online/pedidos?estado=${e}`}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              estado === e
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {ESTADO_LABELS[e]}
          </Link>
        ))}
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">Sin pedidos</p>
          <p className="mt-1 text-xs text-slate-400">
            No hay pedidos con los filtros seleccionados
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Canal
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ítems
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/tienda-online/pedidos/${pedido.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      #{pedido.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{pedido.clienteNombre}</p>
                    {pedido.clienteTelefono && (
                      <p className="text-xs text-slate-400">{pedido.clienteTelefono}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {CANAL_LABELS[pedido.canal] ?? pedido.canal}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{pedido._count.items}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-xs', ESTADO_COLORS[pedido.estado])}>
                      {ESTADO_LABELS[pedido.estado]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    RD$ {Number(pedido.total).toLocaleString('es-DO')}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">
                    {new Date(pedido.createdAt).toLocaleDateString('es-DO', {
                      day: '2-digit',
                      month: 'short',
                    })}
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
