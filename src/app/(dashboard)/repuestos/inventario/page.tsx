import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package, Plus, AlertTriangle } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INDUSTRIAS_REPUESTOS = ['REPUESTOS'];

interface SearchParams {
  q?: string;
  stockBajo?: string;
}

export default async function RepuestosInventarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_REPUESTOS.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { q, stockBajo } = await searchParams;
  const soloStockBajo = stockBajo === 'true';

  const repuestos = await prisma.repuesto.findMany({
    where: {
      empresaId: sesion.empresaActivaId,
      deletedAt: null,
      activo: true,
      ...(q && {
        OR: [
          { codigo: { contains: q.toUpperCase() } },
          { nombre: { contains: q, mode: 'insensitive' } },
          { marca: { contains: q, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: { nombre: 'asc' },
    take: 100,
  });

  const lista = soloStockBajo ? repuestos.filter((r) => r.stock <= r.stockMinimo) : repuestos;
  const conStockBajo = repuestos.filter((r) => r.stock <= r.stockMinimo).length;

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <Package className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Inventario de repuestos</h1>
            <p className="text-sm text-slate-500">
              {repuestos.length} repuesto{repuestos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link
          href="/repuestos/inventario/nuevo"
          className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
        >
          <Plus className="h-4 w-4" />
          Nuevo repuesto
        </Link>
      </div>

      {conStockBajo > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {conStockBajo} repuesto{conStockBajo !== 1 ? 's con' : ' con'} stock bajo.
          </span>
          <Link href="/repuestos/inventario?stockBajo=true" className="font-medium underline">
            Ver
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/repuestos/inventario"
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium',
            !soloStockBajo
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          )}
        >
          Todos
        </Link>
        <Link
          href="/repuestos/inventario?stockBajo=true"
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium',
            soloStockBajo
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          )}
        >
          Stock bajo
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">Sin repuestos</p>
          <Link
            href="/repuestos/inventario/nuevo"
            className={cn(buttonVariants({ size: 'sm' }), 'mt-4 gap-2')}
          >
            <Plus className="h-4 w-4" />
            Agregar primer repuesto
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Vehículo
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Precio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lista.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/repuestos/inventario/${r.id}`}
                      className="font-mono text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {r.codigo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{r.nombre}</p>
                    {r.marca && <p className="text-xs text-slate-400">{r.marca}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {[
                      r.marcaVehiculo,
                      r.modeloVehiculo,
                      r.anioDesde && r.anioHasta ? `${r.anioDesde}–${r.anioHasta}` : null,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        r.stock <= r.stockMinimo
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700',
                      )}
                    >
                      {r.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    RD$ {Number(r.precio).toLocaleString('es-DO')}
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
