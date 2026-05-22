import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Car, ArrowLeft } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { OrdenCarwashAcciones } from './_components/acciones';

const INDUSTRIAS_CARWASH = ['CARWASH'];

const ESTADO_LABELS: Record<string, string> = {
  EN_COLA: 'En cola',
  EN_PROCESO: 'En proceso',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const ESTADO_COLORS: Record<string, string> = {
  EN_COLA: 'bg-amber-100 text-amber-700',
  EN_PROCESO: 'bg-blue-100 text-blue-700',
  LISTO: 'bg-emerald-100 text-emerald-700',
  ENTREGADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-700',
};

export default async function DetalleOrdenCarwashPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_CARWASH.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { id } = await params;

  const orden = await prisma.ordenCarwash.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true } },
    },
  });
  if (!orden) notFound();

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/carwash/ordenes"
          className="rounded-md p-1 text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Car className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Orden #{orden.numero}</h1>
              <Badge className={cn('text-xs', ESTADO_COLORS[orden.estado])}>
                {ESTADO_LABELS[orden.estado]}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              {new Date(orden.createdAt).toLocaleDateString('es-DO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Vehículo */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Vehículo</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">Placa</p>
            <p className="text-lg font-bold text-slate-900">{orden.vehiculoPlaca}</p>
          </div>
          {orden.vehiculoMarca && (
            <div>
              <p className="text-xs text-slate-400">Marca / Modelo</p>
              <p className="font-medium text-slate-700">
                {[orden.vehiculoMarca, orden.vehiculoModelo].filter(Boolean).join(' ')}
              </p>
            </div>
          )}
          {orden.vehiculoColor && (
            <div>
              <p className="text-xs text-slate-400">Color</p>
              <p className="font-medium text-slate-700">{orden.vehiculoColor}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cliente */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Cliente</h2>
        <p className="font-medium text-slate-800">{orden.clienteNombre}</p>
        {orden.clienteTelefono && <p className="text-sm text-slate-500">{orden.clienteTelefono}</p>}
      </div>

      {/* Servicio */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Servicio</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-400">Tipo de servicio</p>
            <p className="font-semibold text-slate-800">{orden.tipoServicio}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Duración estimada</p>
            <p className="font-medium text-slate-700">{orden.duracionMin} min</p>
          </div>
          {orden.empleadoAsignado && (
            <div>
              <p className="text-xs text-slate-400">Empleado</p>
              <p className="font-medium text-slate-700">{orden.empleadoAsignado}</p>
            </div>
          )}
          {orden.notas && (
            <div className="sm:col-span-3">
              <p className="text-xs text-slate-400">Notas</p>
              <p className="text-sm text-slate-600">{orden.notas}</p>
            </div>
          )}
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-xl font-bold text-slate-900">
              RD$ {Number(orden.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Acciones (client component) */}
      {orden.estado !== 'ENTREGADO' && orden.estado !== 'CANCELADO' && (
        <OrdenCarwashAcciones
          ordenId={orden.id}
          estadoActual={orden.estado}
          facturaId={orden.facturaId}
        />
      )}

      {orden.facturaId && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Esta orden fue facturada.{' '}
          <Link href={`/facturas/${orden.facturaId}`} className="font-medium underline">
            Ver factura
          </Link>
        </div>
      )}
    </div>
  );
}
