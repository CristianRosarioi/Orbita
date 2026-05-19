import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Plus } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const INDUSTRIAS_FERRETERIA = ['FERRETERIA', 'MATERIALES', 'PINTURAS'];

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADO: 'Enviado',
  CONFIRMADO: 'Confirmado',
  RECIBIDO: 'Recibido',
  CANCELADO: 'Cancelado',
};

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: 'bg-slate-100 text-slate-600',
  ENVIADO: 'bg-blue-100 text-blue-700',
  CONFIRMADO: 'bg-amber-100 text-amber-700',
  RECIBIDO: 'bg-emerald-100 text-emerald-700',
  CANCELADO: 'bg-red-100 text-red-600',
};

const ESTADOS = Object.keys(ESTADO_LABELS);

interface SearchParams {
  estado?: string;
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_FERRETERIA.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { estado } = await searchParams;

  const pedidos = await prisma.pedidoProveedor.findMany({
    where: {
      empresaId: sesion.empresaActivaId,
      deletedAt: null,
      ...(estado ? { estado: estado as never } : {}),
    },
    include: {
      proveedor: { select: { id: true, nombre: true } },
      _count: { select: { items: true } },
    },
    orderBy: { fechaPedido: 'desc' },
  });

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pedidos a proveedores
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/ferreteria/pedidos/nuevo" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo pedido
        </Link>
      </div>

      {/* Filtro tabs de estado */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/ferreteria/pedidos"
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            !estado
              ? 'bg-slate-900 text-white border-slate-900'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todos
        </Link>
        {ESTADOS.map((e) => (
          <Link
            key={e}
            href={`/ferreteria/pedidos?estado=${e}`}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              estado === e
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {ESTADO_LABELS[e]}
          </Link>
        ))}
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-16 text-center text-slate-500">
          <ShoppingCart className="mx-auto h-10 w-10 mb-3 text-slate-300" />
          <p className="font-medium">Sin pedidos</p>
          <p className="text-sm mt-1">Crea el primer pedido a un proveedor.</p>
          <Link href="/ferreteria/pedidos/nuevo" className={buttonVariants() + ' mt-4'}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo pedido
          </Link>
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">N°</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Proveedor</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Fecha</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Ítems</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">#{p.numero}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.proveedor.nombre}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(p.fechaPedido).toLocaleDateString('es-DO')}
                    {p.fechaEntrega && (
                      <span className="block text-slate-400">
                        Entrega: {new Date(p.fechaEntrega).toLocaleDateString('es-DO')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">{p._count.items}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    RD$ {Number(p.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={ESTADO_COLORS[p.estado]}>{ESTADO_LABELS[p.estado]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/ferreteria/pedidos/${p.id}`}
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
