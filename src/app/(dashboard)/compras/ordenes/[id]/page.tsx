import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrdenAcciones } from './_components/orden-acciones';

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  RECIBIDA_PARCIAL: 'Recibida parcial',
  RECIBIDA: 'Recibida',
  CANCELADA: 'Cancelada',
};

const ESTADO_CLASSES: Record<string, string> = {
  BORRADOR: 'bg-slate-100 text-slate-600',
  ENVIADA: 'bg-blue-100 text-blue-700',
  RECIBIDA_PARCIAL: 'bg-amber-100 text-amber-700',
  RECIBIDA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-700',
};

export default async function OrdenDetalleePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const { id } = await params;

  const orden = await prisma.ordenCompra.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    include: {
      proveedor: { select: { nombre: true, nombreComercial: true, identificacion: true } },
      items: {
        include: { producto: { select: { nombre: true, sku: true } } },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!orden) notFound();

  const fechaCreacion = new Date(orden.createdAt).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const accionItems = orden.items.map((i) => ({
    id: i.id,
    descripcion: i.descripcion,
    cantidad: Number(i.cantidad),
    cantidadRecibida: Number(i.cantidadRecibida),
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/compras/ordenes" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                OC-{String(orden.numero).padStart(4, '0')}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  ESTADO_CLASSES[orden.estado] ?? 'bg-slate-100 text-slate-600'
                }`}
              >
                {ESTADO_LABELS[orden.estado] ?? orden.estado}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">Creada el {fechaCreacion}</p>
          </div>
        </div>

        <OrdenAcciones ordenId={orden.id} estado={orden.estado} items={accionItems} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Info proveedor */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 md:col-span-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Proveedor
          </h2>
          <p className="font-semibold text-slate-900">
            {orden.proveedor.nombreComercial ?? orden.proveedor.nombre}
          </p>
          {orden.proveedor.nombreComercial && (
            <p className="text-sm text-slate-500">{orden.proveedor.nombre}</p>
          )}
          {orden.proveedor.identificacion && (
            <p className="text-sm text-slate-500 mt-0.5">
              RNC: {orden.proveedor.identificacion}
            </p>
          )}
        </div>

        {/* Info fechas */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Fechas
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Creación</span>
              <span className="text-slate-900">
                {new Date(orden.createdAt).toLocaleDateString('es-DO')}
              </span>
            </div>
            {orden.fechaEsperada && (
              <div className="flex justify-between">
                <span className="text-slate-500">Entrega esperada</span>
                <span className="text-slate-900">
                  {new Date(orden.fechaEsperada).toLocaleDateString('es-DO')}
                </span>
              </div>
            )}
            {orden.fechaRecibida && (
              <div className="flex justify-between">
                <span className="text-slate-500">Recibida</span>
                <span className="text-slate-900">
                  {new Date(orden.fechaRecibida).toLocaleDateString('es-DO')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de ítems */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Ítems de la orden</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-2.5 text-left">Descripción</th>
                <th className="px-4 py-2.5 text-right">Cantidad</th>
                <th className="px-4 py-2.5 text-right">Recibida</th>
                <th className="px-4 py-2.5 text-right">Costo unit.</th>
                <th className="px-4 py-2.5 text-right">ITBIS</th>
                <th className="px-5 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orden.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{item.descripcion}</p>
                    {item.producto?.sku && (
                      <p className="text-xs text-slate-400">SKU: {item.producto.sku}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {Number(item.cantidad)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        Number(item.cantidadRecibida) >= Number(item.cantidad)
                          ? 'text-green-600 font-medium'
                          : Number(item.cantidadRecibida) > 0
                            ? 'text-amber-600 font-medium'
                            : 'text-slate-400'
                      }
                    >
                      {Number(item.cantidadRecibida)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    RD$ {Number(item.costoUnitario).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    RD$ {Number(item.itbisMonto).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-slate-900">
                    RD$ {Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 flex justify-end">
          <div className="space-y-1 text-sm min-w-48">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>RD$ {Number(orden.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ITBIS</span>
              <span>RD$ {Number(orden.itbis).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-1 mt-1">
              <span>Total</span>
              <span>RD$ {Number(orden.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notas */}
      {orden.notas && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Notas
          </h2>
          <p className="text-sm text-slate-700">{orden.notas}</p>
        </div>
      )}
    </div>
  );
}
