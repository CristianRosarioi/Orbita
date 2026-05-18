import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Download, Receipt } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function formatFecha(d: Date) {
  return new Date(d).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

async function Tabla607({
  empresaId,
  mes,
  anio,
}: {
  empresaId: string;
  mes: number;
  anio: number;
}) {
  const inicio = new Date(anio, mes - 1, 1);
  const fin = new Date(anio, mes, 0, 23, 59, 59);

  const gastos = await prisma.gasto.findMany({
    where: { empresaId, deletedAt: null, fechaGasto: { gte: inicio, lte: fin } },
    orderBy: { fechaGasto: 'asc' },
    include: {
      proveedor: { select: { nombre: true, nombreComercial: true, identificacion: true } },
    },
  });

  const totalMonto = gastos.reduce((s, g) => s + Number(g.monto), 0);
  const totalITBIS = gastos.reduce((s, g) => s + Number(g.itbis), 0);
  const totalGeneral = gastos.reduce((s, g) => s + Number(g.total), 0);

  if (gastos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 py-16 text-center text-slate-500">
        <Receipt className="mx-auto h-10 w-10 mb-3 text-slate-300" />
        <p className="font-medium">Sin registros para este período</p>
        <p className="text-sm mt-1">
          No hay gastos registrados en {MESES[mes - 1]} {anio}.
        </p>
        <Link
          href="/compras/gastos/nuevo"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
        >
          Registrar primer gasto
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Totales del período */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total compras</p>
          <p className="text-xl font-bold text-slate-900">
            RD$ {totalMonto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">ITBIS total</p>
          <p className="text-xl font-bold text-blue-600">
            RD$ {totalITBIS.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total general</p>
          <p className="text-xl font-bold text-slate-900">
            RD$ {totalGeneral.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>RNC/Cédula</TableHead>
              <TableHead>NCF</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">ITBIS</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gastos.map((g) => (
              <TableRow key={g.id} className="hover:bg-slate-50">
                <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                  {formatFecha(g.fechaGasto)}
                </TableCell>
                <TableCell className="text-slate-700 text-sm">
                  {g.proveedor ? (g.proveedor.nombreComercial ?? g.proveedor.nombre) : '—'}
                </TableCell>
                <TableCell className="text-slate-400 text-xs font-mono">
                  {g.proveedor?.identificacion ?? '—'}
                </TableCell>
                <TableCell className="text-slate-600 text-xs font-mono">
                  {g.ncfProveedor ?? '—'}
                </TableCell>
                <TableCell className="text-slate-600 text-sm max-w-xs truncate">
                  {g.descripcion}
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
}

export default async function Reporte607Page({
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

  const anioActual = hoy.getFullYear();
  const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

  const exportBase = `/api/reportes/607/exportar?mes=${mes}&anio=${anio}`;

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reporte 607</h1>
          <p className="text-slate-500 text-sm mt-1">
            Relación de comprobantes fiscales recibidos — {MESES[mes - 1]} {anio}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`${exportBase}&formato=txt`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            TXT
          </a>
          <a
            href={`${exportBase}&formato=xlsx`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Excel
          </a>
        </div>
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
        <button
          type="submit"
          className="px-4 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700"
        >
          Filtrar
        </button>
      </form>

      <Suspense fallback={<TablaSkeleton />}>
        <Tabla607 empresaId={sesion.empresaActivaId} mes={mes} anio={anio} />
      </Suspense>
    </div>
  );
}
