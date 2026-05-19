import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const INDUSTRIAS_FARMACIA = ['FARMACIA', 'BOTICA', 'DROGUERIA'];

interface SearchParams {
  q?: string;
  estado?: string;
}

function diasRestantes(fecha: Date): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function colorFila(dias: number): string {
  if (dias < 0) return 'bg-red-50';
  if (dias <= 30) return 'bg-amber-50';
  return '';
}

function badgeDias(dias: number) {
  if (dias < 0) return <Badge className="bg-red-100 text-red-700">Vencido</Badge>;
  if (dias <= 30) return <Badge className="bg-amber-100 text-amber-700">{dias}d</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700">{dias}d</Badge>;
}

export default async function LotesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_FARMACIA.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { q, estado } = await searchParams;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const en30dias = new Date(hoy);
  en30dias.setDate(hoy.getDate() + 30);

  const lotes = await prisma.lote.findMany({
    where: {
      empresaId: sesion.empresaActivaId,
      ...(q
        ? {
            OR: [
              { numeroLote: { contains: q, mode: 'insensitive' } },
              { producto: { nombre: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(estado === 'vencido'
        ? { fechaVencimiento: { lt: hoy } }
        : estado === 'por_vencer'
          ? { fechaVencimiento: { gte: hoy, lte: en30dias } }
          : estado === 'vigente'
            ? { fechaVencimiento: { gt: en30dias } }
            : {}),
    },
    include: {
      producto: { select: { id: true, nombre: true, sku: true } },
    },
    orderBy: { fechaVencimiento: 'asc' },
  });

  const totalActivos = lotes.filter((l) => diasRestantes(l.fechaVencimiento) >= 0).length;
  const porVencer = lotes.filter((l) => {
    const d = diasRestantes(l.fechaVencimiento);
    return d >= 0 && d <= 30;
  }).length;
  const vencidos = lotes.filter((l) => diasRestantes(l.fechaVencimiento) < 0).length;

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Control de lotes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {lotes.length} lote{lotes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/farmacia/lotes/nuevo" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo lote
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{totalActivos}</p>
          <p className="text-xs text-slate-500 mt-0.5">Lotes vigentes</p>
        </div>
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{porVencer}</p>
          <p className="text-xs text-amber-600 mt-0.5">Por vencer (&lt;30d)</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{vencidos}</p>
          <p className="text-xs text-red-600 mt-0.5">Vencidos</p>
        </div>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1 flex-1 max-w-xs">
          <label className="text-xs font-medium text-slate-500">Buscar</label>
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Producto o número de lote..."
            className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Estado</label>
          <select
            name="estado"
            defaultValue={estado ?? ''}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Todos</option>
            <option value="vigente">Vigente</option>
            <option value="por_vencer">Por vencer</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700"
        >
          Filtrar
        </button>
        {(q || estado) && (
          <Link
            href="/farmacia/lotes"
            className="px-4 py-1.5 text-sm border border-slate-200 rounded-md hover:bg-slate-50"
          >
            Limpiar
          </Link>
        )}
      </form>

      {lotes.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-16 text-center text-slate-500">
          <Package className="mx-auto h-10 w-10 mb-3 text-slate-300" />
          <p className="font-medium">Sin lotes registrados</p>
          <p className="text-sm mt-1">Registra el primer lote de producto.</p>
          <Link href="/farmacia/lotes/nuevo" className={buttonVariants() + ' mt-4'}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo lote
          </Link>
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">N° Lote</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Proveedor</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">F. Vencimiento</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Cant. Inicial</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Cant. Actual</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((lote) => {
                const dias = diasRestantes(lote.fechaVencimiento);
                return (
                  <tr key={lote.id} className={`border-b border-slate-100 ${colorFila(dias)}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {lote.producto.nombre}
                      {lote.producto.sku && (
                        <span className="ml-1.5 text-xs text-slate-400">({lote.producto.sku})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">{lote.numeroLote}</td>
                    <td className="px-4 py-3 text-slate-500">{lote.proveedor ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {lote.fechaVencimiento.toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {Number(lote.cantidadInicial)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {Number(lote.cantidadActual)}
                    </td>
                    <td className="px-4 py-3 text-center">{badgeDias(dias)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
