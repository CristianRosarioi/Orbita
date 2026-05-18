import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Receipt, Plus } from 'lucide-react';
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

const ESTADO_CLASSES: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  PAGADO: 'bg-green-100 text-green-700',
  VENCIDO: 'bg-red-100 text-red-700',
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  VENCIDO: 'Vencido',
};

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CATEGORIAS = [
  'ALQUILER', 'SERVICIOS_PUBLICOS', 'NOMINA', 'MARKETING',
  'EQUIPOS', 'TRANSPORTE', 'COMUNICACIONES', 'SEGUROS', 'IMPUESTOS', 'OTROS',
];

const CATEGORIA_LABELS: Record<string, string> = {
  ALQUILER: 'Alquiler',
  SERVICIOS_PUBLICOS: 'Servicios públicos',
  NOMINA: 'Nómina',
  MARKETING: 'Marketing',
  EQUIPOS: 'Equipos',
  TRANSPORTE: 'Transporte',
  COMUNICACIONES: 'Comunicaciones',
  SEGUROS: 'Seguros',
  IMPUESTOS: 'Impuestos',
  OTROS: 'Otros',
};

async function TablaGastos({
  empresaId,
  mes,
  anio,
  categoria,
}: {
  empresaId: string;
  mes: number;
  anio: number;
  categoria: string;
}) {
  const inicio = new Date(anio, mes - 1, 1);
  const fin = new Date(anio, mes, 0, 23, 59, 59);

  const gastos = await prisma.gasto.findMany({
    where: {
      empresaId,
      deletedAt: null,
      fechaGasto: { gte: inicio, lte: fin },
      ...(categoria ? { categoria } : {}),
    },
    orderBy: { fechaGasto: 'desc' },
    include: {
      proveedor: { select: { nombre: true, nombreComercial: true } },
    },
  });

  const totalPeriodo = gastos.reduce((s, g) => s + Number(g.total), 0);

  if (gastos.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Receipt className="mx-auto h-10 w-10 mb-3 text-slate-300" />
        <p className="font-medium">No hay gastos registrados</p>
        <p className="text-sm mt-1">No hay gastos para el período seleccionado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen del período */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total gastos</p>
          <p className="text-xl font-bold text-slate-900">
            RD$ {totalPeriodo.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">ITBIS total</p>
          <p className="text-xl font-bold text-blue-600">
            RD${' '}
            {gastos
              .reduce((s, g) => s + Number(g.itbis), 0)
              .toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Registros</p>
          <p className="text-xl font-bold text-slate-900">{gastos.length}</p>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>NCF</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">ITBIS</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gastos.map((g) => (
              <TableRow key={g.id} className="hover:bg-slate-50">
                <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                  {new Date(g.fechaGasto).toLocaleDateString('es-DO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-slate-900 font-medium text-sm max-w-xs truncate">
                  {g.descripcion}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {g.proveedor
                    ? (g.proveedor.nombreComercial ?? g.proveedor.nombre)
                    : '—'}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {g.categoria ? (CATEGORIA_LABELS[g.categoria] ?? g.categoria) : '—'}
                </TableCell>
                <TableCell className="text-slate-400 text-xs font-mono">
                  {g.ncfProveedor ?? '—'}
                </TableCell>
                <TableCell className="text-right text-slate-700 text-sm">
                  RD$ {Number(g.monto).toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-slate-500 text-sm">
                  RD$ {Number(g.itbis).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium text-slate-900 text-sm">
                  RD$ {Number(g.total).toFixed(2)}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      ESTADO_CLASSES[g.estado] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {ESTADO_LABELS[g.estado] ?? g.estado}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
  mes?: string;
  anio?: string;
  categoria?: string;
}

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const hoy = new Date();
  const params = await searchParams;
  const mes = parseInt(params.mes ?? String(hoy.getMonth() + 1), 10);
  const anio = parseInt(params.anio ?? String(hoy.getFullYear()), 10);
  const categoria = CATEGORIAS.includes(params.categoria ?? '') ? (params.categoria ?? '') : '';

  const anioActual = hoy.getFullYear();
  const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gastos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Registro de gastos operativos y comprobantes fiscales
          </p>
        </div>
        <Link href="/compras/gastos/nuevo" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo gasto
        </Link>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Mes</label>
          <select
            name="mes"
            defaultValue={mes}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Año</label>
          <select
            name="anio"
            defaultValue={anio}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Categoría</label>
          <select
            name="categoria"
            defaultValue={categoria}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
          >
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_LABELS[c] ?? c}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700"
        >
          Filtrar
        </button>
      </form>

      <Suspense fallback={<TablaSkeleton />}>
        <TablaGastos
          empresaId={sesion.empresaActivaId}
          mes={mes}
          anio={anio}
          categoria={categoria}
        />
      </Suspense>
    </div>
  );
}
