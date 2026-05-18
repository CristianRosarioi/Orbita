import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText, Plus } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

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

export default async function NominasPage() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const nominas = await prisma.nomina.findMany({
    where: { empresaId: sesion.empresaActivaId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nóminas</h1>
          <p className="text-slate-500 text-sm mt-1">
            {nominas.length} nómina{nominas.length !== 1 ? 's' : ''} registrada
            {nominas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/nomina/nominas/nueva" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva nómina
        </Link>
      </div>

      {nominas.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-16 text-center text-slate-500">
          <FileText className="mx-auto h-10 w-10 mb-3 text-slate-300" />
          <p className="font-medium">Sin nóminas registradas</p>
          <p className="text-sm mt-1">Crea tu primera nómina para pagar a tus empleados.</p>
          <Link href="/nomina/nominas/nueva" className={buttonVariants() + ' mt-4'}>
            <Plus className="h-4 w-4 mr-1.5" />
            Crear nómina
          </Link>
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Período</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Fechas</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Empleados</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Total bruto</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Total neto</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {nominas.map((nom) => (
                <tr key={nom.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{nom.periodo}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(nom.fechaInicio).toLocaleDateString('es-DO')} —{' '}
                    {new Date(nom.fechaFin).toLocaleDateString('es-DO')}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-700">{nom._count.items}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    RD${' '}
                    {Number(nom.totalBruto).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-700">
                    RD${' '}
                    {Number(nom.totalNeto).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={ESTADO_COLORS[nom.estado]}>{ESTADO_LABELS[nom.estado]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/nomina/nominas/${nom.id}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Ver detalle
                    </Link>
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
