import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PedidoOnlineAcciones } from './_components/acciones';

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

export default async function DetallePedidoOnlinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_TIENDA_ONLINE.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { id } = await params;

  const pedido = await prisma.pedidoOnline.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    include: {
      items: {
        include: { producto: { select: { id: true, nombre: true } } },
      },
      cliente: { select: { id: true, nombre: true, telefono: true } },
    },
  });
  if (!pedido) notFound();

  const puedeAccionar = !['ENTREGADO', 'CANCELADO'].includes(pedido.estado);

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/tienda-online/pedidos"
          className="rounded-md p-1 text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Pedido #{pedido.numero}</h1>
              <Badge className={cn('text-xs', ESTADO_COLORS[pedido.estado])}>
                {ESTADO_LABELS[pedido.estado]}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              {CANAL_LABELS[pedido.canal] ?? pedido.canal} ·{' '}
              {new Date(pedido.createdAt).toLocaleDateString('es-DO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Cliente</h2>
        <p className="font-medium text-slate-800">{pedido.clienteNombre}</p>
        {pedido.clienteTelefono && (
          <p className="text-sm text-slate-500">{pedido.clienteTelefono}</p>
        )}
        {pedido.direccionEntrega && (
          <p className="mt-2 text-sm text-slate-500">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Dirección:{' '}
            </span>
            {pedido.direccionEntrega}
          </p>
        )}
      </div>

      {/* Ítems */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Ítems</h2>
        <div className="space-y-2">
          {pedido.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.descripcion}</p>
                {item.producto && <p className="text-xs text-slate-400">{item.producto.nombre}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  {item.cantidad} × RD$ {Number(item.precioUnitario).toLocaleString('es-DO')}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  RD$ {Number(item.subtotal).toLocaleString('es-DO')}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-1">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>
              RD$ {Number(pedido.subtotal).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>ITBIS (18%)</span>
            <span>
              RD$ {Number(pedido.itbis).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {pedido.metodoPago && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Método de pago</span>
              <span>{pedido.metodoPago}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-slate-900">
            <span>Total</span>
            <span>
              RD$ {Number(pedido.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Notas */}
      {pedido.notas && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Notas</h2>
          <p className="text-sm text-slate-600">{pedido.notas}</p>
        </div>
      )}

      {/* Tracking */}
      {pedido.tracking && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Tracking</h2>
          <p className="font-mono text-sm text-slate-700">{pedido.tracking}</p>
        </div>
      )}

      {/* Acciones */}
      {puedeAccionar && (
        <PedidoOnlineAcciones
          pedidoId={pedido.id}
          estadoActual={pedido.estado}
          facturaId={pedido.facturaId}
        />
      )}

      {pedido.facturaId && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Este pedido fue facturado.{' '}
          <Link href={`/facturas/${pedido.facturaId}`} className="font-medium underline">
            Ver factura
          </Link>
        </div>
      )}
    </div>
  );
}
