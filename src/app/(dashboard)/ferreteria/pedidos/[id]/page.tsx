import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import PedidoAcciones from './_components/pedido-acciones';
import AgregarItemPedido from './_components/agregar-item-pedido';

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

export default async function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_FERRETERIA.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { id } = await params;
  const pedido = await prisma.pedidoProveedor.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    include: {
      proveedor: { select: { id: true, nombre: true, telefono: true, email: true } },
      items: {
        include: { producto: { select: { id: true, nombre: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!pedido) notFound();

  const esBorrador = pedido.estado === 'BORRADOR';

  return (
    <div className="p-4 space-y-6 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/ferreteria/pedidos" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pedido #{pedido.numero}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">{pedido.proveedor.nombre}</p>
          </div>
        </div>
        <Badge className={ESTADO_COLORS[pedido.estado]}>{ESTADO_LABELS[pedido.estado]}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tabla de ítems */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Ítems del pedido
              </h2>
              {esBorrador && <AgregarItemPedido pedidoId={pedido.id} />}
            </div>

            {pedido.items.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                Sin ítems. Agrega productos al pedido.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Descripción</th>
                    <th className="text-center px-4 py-2 font-medium text-slate-600">Unidad</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">Cant.</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">P. Unit.</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 text-slate-900">
                        {item.descripcion}
                        {item.producto && (
                          <span className="text-xs text-slate-400 block">
                            {item.producto.nombre}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-500">
                        {item.unidadMedida}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-700">
                        {Number(item.cantidad)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-700">
                        RD${' '}
                        {Number(item.precioUnitario).toLocaleString('es-DO', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-900">
                        RD${' '}
                        {Number(item.subtotal).toLocaleString('es-DO', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-700">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 text-base">
                      RD${' '}
                      {Number(pedido.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Acciones
            </h2>
            <PedidoAcciones
              pedidoId={pedido.id}
              estado={pedido.estado}
              items={pedido.items.map((i) => ({
                productoId: i.productoId,
                descripcion: i.descripcion,
                cantidad: Number(i.cantidad),
                precioUnitario: Number(i.precioUnitario),
              }))}
            />
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Proveedor
            </h2>
            <p className="font-medium text-slate-900">{pedido.proveedor.nombre}</p>
            {pedido.proveedor.telefono && (
              <p className="text-sm text-slate-500">{pedido.proveedor.telefono}</p>
            )}
            {pedido.proveedor.email && (
              <p className="text-sm text-slate-500">{pedido.proveedor.email}</p>
            )}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Fechas</h2>
            <div>
              <p className="text-xs text-slate-500">Pedido</p>
              <p className="text-sm text-slate-900">
                {new Date(pedido.fechaPedido).toLocaleDateString('es-DO')}
              </p>
            </div>
            {pedido.fechaEntrega && (
              <div>
                <p className="text-xs text-slate-500">Entrega esperada</p>
                <p className="text-sm text-slate-900">
                  {new Date(pedido.fechaEntrega).toLocaleDateString('es-DO')}
                </p>
              </div>
            )}
          </div>

          {pedido.notas && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-1">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Notas
              </h2>
              <p className="text-sm text-slate-600">{pedido.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
