import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FacturaStatusBadge } from '@/components/shared/factura-status-badge';
import { MoneyDisplay } from '@/components/shared/money-display';
import { FacturaActions } from './_components/factura-actions';
import { ImprimirTicketButton } from './_components/imprimir-ticket-button';

const METODO_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE: 'Cheque',
  CREDITO: 'Crédito',
};

export default async function FacturaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const { id } = await params;
  const empresaId = sesion.empresaActivaId;

  const factura = await prisma.factura.findFirst({
    where: { id, empresaId, deletedAt: null },
    include: {
      items: true,
      pagos: { orderBy: { fechaPago: 'desc' } },
      cliente: {
        select: {
          id: true,
          nombre: true,
          identificacion: true,
          tipoIdentificacion: true,
          email: true,
          telefono: true,
        },
      },
    },
  });

  if (!factura) notFound();

  const saldo = Number(factura.saldo);
  const total = Number(factura.total);
  const totalPagado = Number(factura.totalPagado);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/facturas" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">{factura.numero}</h1>
              <FacturaStatusBadge estado={factura.estado} />
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              {new Date(factura.fechaEmision).toLocaleDateString('es-DO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
              {' · '}
              {METODO_LABELS[factura.metodoPago] ?? factura.metodoPago}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <FacturaActions facturaId={factura.id} estado={factura.estado} saldo={saldo} />
          <ImprimirTicketButton facturaId={factura.id} />
        </div>
      </div>

      {/* Client info */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Cliente
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-slate-500">Nombre:</span>{' '}
            <span className="font-medium text-slate-900">{factura.clienteNombre}</span>
          </div>
          {factura.clienteIdentificacion && (
            <div>
              <span className="text-slate-500">Identificación:</span>{' '}
              <span className="text-slate-700">{factura.clienteIdentificacion}</span>
            </div>
          )}
          {factura.cliente?.email && (
            <div>
              <span className="text-slate-500">Email:</span>{' '}
              <span className="text-slate-700">{factura.cliente.email}</span>
            </div>
          )}
          {factura.cliente?.telefono && (
            <div>
              <span className="text-slate-500">Teléfono:</span>{' '}
              <span className="text-slate-700">{factura.cliente.telefono}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Items */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Productos / Servicios
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="pb-2 text-left font-medium">Descripción</th>
                <th className="pb-2 text-right font-medium px-3 w-16">Cant.</th>
                <th className="pb-2 text-right font-medium px-3 w-28">Precio unit.</th>
                <th className="pb-2 text-right font-medium px-3 w-20">ITBIS</th>
                <th className="pb-2 text-right font-medium pl-3 w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {factura.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-3">
                    <p className="font-medium text-slate-900">{item.productoNombre}</p>
                    {item.productoSku && (
                      <p className="text-xs text-slate-400">SKU: {item.productoSku}</p>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">{Number(item.cantidad)}</td>
                  <td className="py-2 px-3 text-right text-slate-600">
                    <MoneyDisplay amount={item.precioUnitario} currency="RD$" />
                  </td>
                  <td className="py-2 px-3 text-right text-slate-500 text-xs">
                    {Number(item.itbisPorcentaje)}%
                  </td>
                  <td className="py-2 pl-3 text-right font-medium text-slate-900">
                    <MoneyDisplay amount={item.total} currency="RD$" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator />

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <MoneyDisplay amount={factura.subtotal} currency="RD$" />
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ITBIS</span>
              <MoneyDisplay amount={factura.itbis} currency="RD$" />
            </div>
            {Number(factura.descuento) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuento</span>
                <span>
                  - <MoneyDisplay amount={factura.descuento} currency="RD$" />
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-2">
              <span>Total</span>
              <MoneyDisplay amount={total} currency="RD$" />
            </div>
            {totalPagado > 0 && (
              <>
                <div className="flex justify-between text-green-700">
                  <span>Pagado</span>
                  <MoneyDisplay amount={totalPagado} currency="RD$" />
                </div>
                <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Saldo</span>
                  <MoneyDisplay amount={saldo} currency="RD$" />
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Notes */}
      {factura.notas && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Notas
          </h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{factura.notas}</p>
        </Card>
      )}

      {/* Cancellation info */}
      {factura.estado === 'ANULADA' && factura.motivoAnulacion && (
        <Card className="p-5 border-red-100 bg-red-50">
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-2">
            Motivo de anulación
          </h2>
          <p className="text-sm text-red-700">{factura.motivoAnulacion}</p>
        </Card>
      )}

      {/* Payments */}
      {factura.pagos.length > 0 && (
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Pagos registrados
          </h2>
          <div className="space-y-2">
            {factura.pagos.map((pago) => (
              <div
                key={pago.id}
                className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {METODO_LABELS[pago.metodoPago] ?? pago.metodoPago}
                  </span>
                  {pago.referencia && (
                    <span className="ml-2 text-slate-400 text-xs">Ref: {pago.referencia}</span>
                  )}
                  <div className="text-xs text-slate-400">
                    {new Date(pago.fechaPago).toLocaleDateString('es-DO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <span className="font-semibold text-green-700">
                  <MoneyDisplay amount={pago.monto} currency="RD$" />
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
