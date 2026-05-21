import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CotizacionAcciones } from './_components/acciones';

const INDUSTRIAS_REPUESTOS = ['REPUESTOS'];

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  FACTURADA: 'Facturada',
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  APROBADA: 'bg-emerald-100 text-emerald-700',
  RECHAZADA: 'bg-red-100 text-red-700',
  FACTURADA: 'bg-blue-100 text-blue-700',
};

export default async function DetalleCotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_REPUESTOS.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { id } = await params;

  const cotizacion = await prisma.cotizacion.findFirst({
    where: { id, empresaId: sesion.empresaActivaId },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true } },
      items: {
        include: { repuesto: { select: { id: true, codigo: true, nombre: true } } },
      },
    },
  });
  if (!cotizacion) notFound();

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/repuestos/cotizaciones" className="rounded-md p-1 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <FileText className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Cotización #{cotizacion.numero}</h1>
              <Badge className={cn('text-xs', ESTADO_COLORS[cotizacion.estado])}>
                {ESTADO_LABELS[cotizacion.estado]}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              {new Date(cotizacion.createdAt).toLocaleDateString('es-DO', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Cliente y vehículo */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Cliente</h2>
        <p className="font-semibold text-slate-800">{cotizacion.clienteNombre}</p>
        {cotizacion.clienteTelefono && <p className="text-sm text-slate-500">{cotizacion.clienteTelefono}</p>}

        {(cotizacion.vehiculoMarca || cotizacion.vehiculoPlaca) && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Vehículo</p>
            <p className="text-sm text-slate-600">
              {[cotizacion.vehiculoMarca, cotizacion.vehiculoModelo, cotizacion.vehiculoAnio, cotizacion.vehiculoPlaca]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        )}
      </div>

      {/* Ítems */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Ítems ({cotizacion.items.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Descripción</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Cant.</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Precio</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">ITBIS</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cotizacion.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{item.descripcion}</p>
                  {item.repuesto && (
                    <p className="text-xs text-slate-400">{item.repuesto.codigo}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-slate-600">{item.cantidad}</td>
                <td className="px-4 py-3 text-right text-slate-600">RD$ {Number(item.precioUnitario).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right text-slate-400">RD$ {Number(item.itbisMonto).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">RD$ {Number(item.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right text-sm text-slate-500">Subtotal:</td>
              <td className="px-4 py-3 text-right font-medium text-slate-700">RD$ {Number(cotizacion.subtotal).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td colSpan={4} className="px-4 py-2 text-right text-sm text-slate-500">ITBIS 18%:</td>
              <td className="px-4 py-2 text-right font-medium text-slate-700">RD$ {Number(cotizacion.itbis).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right text-base font-bold text-slate-900">Total:</td>
              <td className="px-4 py-3 text-right text-base font-bold text-slate-900">RD$ {Number(cotizacion.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {cotizacion.notas && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Notas</h2>
          <p className="text-sm text-slate-600">{cotizacion.notas}</p>
        </div>
      )}

      {/* Acciones */}
      {cotizacion.estado !== 'FACTURADA' && (
        <CotizacionAcciones
          cotizacionId={cotizacion.id}
          estadoActual={cotizacion.estado}
          facturaId={cotizacion.facturaId}
        />
      )}

      {cotizacion.facturaId && (
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Cotización facturada.{' '}
          <Link href={`/facturas/${cotizacion.facturaId}`} className="font-medium underline">
            Ver factura
          </Link>
        </div>
      )}
    </div>
  );
}
