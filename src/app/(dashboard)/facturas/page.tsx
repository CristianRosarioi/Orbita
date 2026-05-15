import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, FileText } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FacturaStatusBadge } from '@/components/shared/factura-status-badge';
import { MoneyDisplay } from '@/components/shared/money-display';

const TABS = [
  { label: 'Todas', value: '' },
  { label: 'Borrador', value: 'BORRADOR' },
  { label: 'Emitida', value: 'EMITIDA' },
  { label: 'Pagada', value: 'PAGADA' },
  { label: 'Anulada', value: 'ANULADA' },
  { label: 'Vencida', value: 'VENCIDA' },
];

type SearchParams = {
  estado?: string;
  search?: string;
  desde?: string;
  hasta?: string;
  page?: string;
};

async function FacturasList({
  empresaId,
  searchParams,
}: {
  empresaId: string;
  searchParams: SearchParams;
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const limit = 20;
  const skip = (page - 1) * limit;
  const { estado, search, desde, hasta } = searchParams;

  const where: Prisma.FacturaWhereInput = {
    empresaId,
    deletedAt: null,
    ...(estado && { estado: estado as never }),
    ...(desde || hasta
      ? {
          fechaEmision: {
            ...(desde ? { gte: new Date(desde) } : {}),
            ...(hasta ? { lte: new Date(hasta) } : {}),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { numero: { contains: search, mode: 'insensitive' as const } },
        { clienteNombre: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [facturas, total, totalVentas] = await Promise.all([
    prisma.factura.findMany({
      where,
      orderBy: { fechaEmision: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        numero: true,
        clienteNombre: true,
        fechaEmision: true,
        metodoPago: true,
        total: true,
        estado: true,
        saldo: true,
      },
    }),
    prisma.factura.count({ where }),
    prisma.factura.aggregate({
      where: {
        ...where,
        estado: { in: ['PAGADA', 'EMITIDA'] },
      },
      _sum: { total: true },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const sumaTotal = Number(totalVentas._sum.total ?? 0);

  const METODO_LABELS: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    TARJETA: 'Tarjeta',
    TRANSFERENCIA: 'Transferencia',
    CHEQUE: 'Cheque',
    CREDITO: 'Crédito',
  };

  return (
    <div className="space-y-4">
      {facturas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400 flex flex-col items-center gap-3">
          <FileText className="h-10 w-10 text-slate-300" />
          <div>
            <p className="font-medium text-slate-500">No hay facturas</p>
            <p className="mt-1">Crea tu primera factura con el botón de arriba</p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Método
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facturas.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{f.numero}</td>
                    <td className="px-4 py-3 text-slate-700">{f.clienteNombre}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(f.fechaEmision).toLocaleDateString('es-DO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {METODO_LABELS[f.metodoPago] ?? f.metodoPago}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      <MoneyDisplay amount={f.total} currency="RD$" />
                    </td>
                    <td className="px-4 py-3">
                      <FacturaStatusBadge estado={f.estado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/facturas/${f.id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <div>
              {total} factura{total !== 1 ? 's' : ''} — Total (emitidas + pagadas):{' '}
              <span className="font-semibold text-slate-900">
                <MoneyDisplay amount={sumaTotal} currency="RD$" />
              </span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span>
                  Página {page} de {totalPages}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const params = await searchParams;
  const { estado = '', search = '', desde = '', hasta = '' } = params;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestiona tus facturas y cobros</p>
        </div>
        <Link href="/facturas/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva factura
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-3">
        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/facturas?${new URLSearchParams({
                ...(tab.value ? { estado: tab.value } : {}),
                ...(search ? { search } : {}),
                ...(desde ? { desde } : {}),
                ...(hasta ? { hasta } : {}),
              }).toString()}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                estado === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Search and date filters */}
        <div className="flex gap-3 flex-wrap">
          <form method="GET" action="/facturas" className="flex gap-3 flex-wrap flex-1">
            {estado && <input type="hidden" name="estado" value={estado} />}
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Buscar por número o cliente..."
              className="flex-1 min-w-48 h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <input
              type="date"
              name="desde"
              defaultValue={desde}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
            />
            <input
              type="date"
              name="hasta"
              defaultValue={hasta}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
            />
            <Button type="submit" variant="outline" size="sm">
              Filtrar
            </Button>
          </form>
        </div>
      </Card>

      {/* Table */}
      <Suspense
        fallback={
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        }
      >
        <FacturasList empresaId={sesion.empresaActivaId} searchParams={params} />
      </Suspense>
    </div>
  );
}
