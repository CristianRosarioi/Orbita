import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import NominaAcciones from './_components/nomina-acciones';

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: 'bg-slate-100 text-slate-600',
  PROCESADA: 'bg-blue-100 text-blue-700',
  PAGADA: 'bg-emerald-100 text-emerald-700',
  ANULADA: 'bg-red-100 text-red-700',
};

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  PROCESADA: 'Procesada',
  PAGADA: 'Pagada',
  ANULADA: 'Anulada',
};

const fmt = (n: unknown) =>
  `RD$ ${Number(n).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

export default async function NominaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const { id } = await params;
  const nomina = await prisma.nomina.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    include: {
      items: {
        include: {
          empleado: {
            select: { id: true, nombre: true, apellido: true, cargo: true, cedula: true },
          },
        },
        orderBy: { empleado: { apellido: 'asc' } },
      },
    },
  });

  if (!nomina) notFound();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/nomina/nominas"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a nóminas
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Nómina: {nomina.periodo}
            </h1>
            <Badge className={ESTADO_COLORS[nomina.estado]}>{ESTADO_LABELS[nomina.estado]}</Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {new Date(nomina.fechaInicio).toLocaleDateString('es-DO')} —{' '}
            {new Date(nomina.fechaFin).toLocaleDateString('es-DO')} · {nomina.items.length} empleado
            {nomina.items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <NominaAcciones nominaId={id} estado={nomina.estado} />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total bruto', value: nomina.totalBruto, color: 'text-slate-900' },
          { label: 'TSS empleados', value: nomina.totalTSS, color: 'text-amber-600' },
          { label: 'ISR retenido', value: nomina.totalISR, color: 'text-amber-600' },
          { label: 'Otros descuentos', value: nomina.totalOtros, color: 'text-slate-500' },
          { label: 'Total a pagar', value: nomina.totalNeto, color: 'text-emerald-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Detalle por empleado */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Detalle por empleado</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Empleado</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Salario bruto</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">TSS</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">ISR</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Otros desc.</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Salario neto</th>
              </tr>
            </thead>
            <tbody>
              {nomina.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {item.empleado.apellido}, {item.empleado.nombre}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.empleado.cargo} · Cédula: {item.empleado.cedula}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{fmt(item.salarioBruto)}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{fmt(item.tssTrabajador)}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{fmt(item.isr)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {fmt(item.otrosDescuentos)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                    {fmt(item.salarioNeto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
