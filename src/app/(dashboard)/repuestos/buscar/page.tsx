import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, Package } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cn } from '@/lib/utils';
import { BuscarRepuestosForm } from './_components/form';

const INDUSTRIAS_REPUESTOS = ['REPUESTOS'];

interface SearchParams {
  marca?: string;
  modelo?: string;
  anio?: string;
  q?: string;
}

export default async function BuscarRepuestosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_REPUESTOS.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { marca, modelo, anio, q } = await searchParams;
  const tieneFiltros = !!(marca || modelo || anio || q);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let resultados: any[] = [];

  if (tieneFiltros) {
    const anioNum = anio ? parseInt(anio) : undefined;
    resultados = await prisma.repuesto.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        deletedAt: null,
        activo: true,
        ...(marca && { marcaVehiculo: { contains: marca, mode: 'insensitive' } }),
        ...(modelo && { modeloVehiculo: { contains: modelo, mode: 'insensitive' } }),
        ...(anioNum && {
          AND: [
            { OR: [{ anioDesde: null }, { anioDesde: { lte: anioNum } }] },
            { OR: [{ anioHasta: null }, { anioHasta: { gte: anioNum } }] },
          ],
        }),
        ...(q && {
          OR: [
            { codigo: { contains: q.toUpperCase() } },
            { nombre: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ stock: 'desc' }, { nombre: 'asc' }],
      take: 50,
      select: {
        id: true,
        codigo: true,
        nombre: true,
        marca: true,
        marcaVehiculo: true,
        modeloVehiculo: true,
        anioDesde: true,
        anioHasta: true,
        stock: true,
        precio: true,
      },
    });
  }

  return (
    <div className="p-4 space-y-6 md:p-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
          <Search className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Buscar por vehículo</h1>
          <p className="text-sm text-slate-500">
            Encuentra repuestos compatibles con el vehículo del cliente
          </p>
        </div>
      </div>

      <BuscarRepuestosForm
        defaultValues={{ marca: marca ?? '', modelo: modelo ?? '', anio: anio ?? '', q: q ?? '' }}
      />

      {tieneFiltros && (
        <div>
          <p className="mb-3 text-sm text-slate-500">
            {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} encontrado
            {resultados.length !== 1 ? 's' : ''}
          </p>

          {resultados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <Package className="mx-auto mb-3 h-7 w-7 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">Sin resultados</p>
              <p className="mt-1 text-xs text-slate-400">Prueba con otros criterios de búsqueda</p>
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
                      Repuesto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Compatible
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
                  {resultados.map((r) => (
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
                      <td className="px-4 py-3 text-xs text-slate-500">
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
                            r.stock === 0
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
      )}
    </div>
  );
}
