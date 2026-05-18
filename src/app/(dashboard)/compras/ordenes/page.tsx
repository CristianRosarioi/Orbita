import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShoppingBag, Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentEmpresa } from '@/lib/auth';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        ESTADO_CLASSES[estado] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {ESTADO_LABELS[estado] ?? estado}
    </span>
  );
}

const ESTADOS_FILTER = ['', 'BORRADOR', 'ENVIADA', 'RECIBIDA_PARCIAL', 'RECIBIDA', 'CANCELADA'];

async function TablaOrdenes({
  empresaId,
  estado,
}: {
  empresaId: string;
  estado: string;
}) {
  const ordenes = await prisma.ordenCompra.findMany({
    where: {
      empresaId,
      deletedAt: null,
      ...(estado ? { estado: estado as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      proveedor: { select: { nombre: true, nombreComercial: true } },
      _count: { select: { items: true } },
    },
    take: 50,
  });

  if (ordenes.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <ShoppingBag className="mx-auto h-10 w-10 mb-3 text-slate-300" />
        <p className="font-medium">No hay órdenes de compra</p>
        <p className="text-sm mt-1">
          {estado ? 'No hay órdenes con este estado.' : 'Crea tu primera orden de compra.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Número</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Ítems</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenes.map((o) => (
            <TableRow key={o.id} className="hover:bg-slate-50">
              <TableCell>
                <Link
                  href={`/compras/ordenes/${o.id}`}
                  className="font-semibold text-slate-900 hover:text-indigo-600"
                >
                  OC-{String(o.numero).padStart(4, '0')}
                </Link>
              </TableCell>
              <TableCell className="text-slate-700 text-sm">
                {o.proveedor.nombreComercial ?? o.proveedor.nombre}
              </TableCell>
              <TableCell className="text-slate-500 text-sm">
                {new Date(o.createdAt).toLocaleDateString('es-DO', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell className="text-slate-500 text-sm">{o._count.items}</TableCell>
              <TableCell className="text-right font-medium text-slate-900">
                RD$ {Number(o.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                <EstadoBadge estado={o.estado} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TablaSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  );
}

interface SearchParams {
  estado?: string;
}

export default async function OrdenesCompraPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const params = await searchParams;
  const estado = ESTADOS_FILTER.includes(params.estado ?? '') ? (params.estado ?? '') : '';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Órdenes de compra</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona las compras a tus proveedores</p>
        </div>
        <Link href="/compras/ordenes/nueva" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva orden
        </Link>
      </div>

      {/* Filtro por estado */}
      <div className="flex gap-2 flex-wrap">
        {ESTADOS_FILTER.map((e) => (
          <Link
            key={e}
            href={e ? `?estado=${e}` : '/compras/ordenes'}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              estado === e
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {e ? (ESTADO_LABELS[e] ?? e) : 'Todos'}
          </Link>
        ))}
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <TablaOrdenes empresaId={sesion.empresaActivaId} estado={estado} />
      </Suspense>
    </div>
  );
}
