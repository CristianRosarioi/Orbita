import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getCurrentEmpresa, getCurrentMembership } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function fmt(n: number) {
  return new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(n);
}

function fmtFecha(d: Date | string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function HistorialCajaPage() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const membresia = await getCurrentMembership();
  if (!membresia || !['OWNER', 'ADMIN', 'CONTADOR'].includes(membresia.rol)) {
    redirect('/pos');
  }

  const empresaId = sesion.empresaActivaId;

  const sesiones = await prisma.sesionCaja.findMany({
    where: { empresaId },
    orderBy: { fechaApertura: 'desc' },
    take: 50,
  });

  const sesionesEnriquecidas = await Promise.all(
    sesiones.map(async (s) => {
      const total = await prisma.factura.aggregate({
        where: { empresaId, sesionCajaId: s.id, deletedAt: null, estado: { not: 'ANULADA' } },
        _sum: { total: true },
        _count: { id: true },
      });
      return {
        ...s,
        totalVendido: Number(total._sum.total ?? 0),
        cantidadFacturas: total._count.id,
      };
    }),
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/pos" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de caja</h1>
          <p className="text-slate-500 text-sm">Todas las sesiones de caja registradas</p>
        </div>
      </div>

      {sesionesEnriquecidas.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <p>No hay sesiones de caja registradas todavía.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="pb-2 text-left font-medium">Apertura</th>
                <th className="pb-2 text-left font-medium">Cierre</th>
                <th className="pb-2 text-right font-medium px-3">Apertura (RD$)</th>
                <th className="pb-2 text-right font-medium px-3">Ventas (RD$)</th>
                <th className="pb-2 text-right font-medium px-3">Facturas</th>
                <th className="pb-2 text-right font-medium px-3">Diferencia</th>
                <th className="pb-2 text-center font-medium pl-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sesionesEnriquecidas.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-3 text-slate-600">{fmtFecha(s.fechaApertura)}</td>
                  <td className="py-3 pr-3 text-slate-600">{fmtFecha(s.fechaCierre)}</td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    {fmt(Number(s.montoApertura))}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-green-700">
                    {fmt(s.totalVendido)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">{s.cantidadFacturas}</td>
                  <td className="py-3 px-3 text-right">
                    {s.diferencia !== null ? (
                      <span
                        className={
                          Number(s.diferencia) < 0
                            ? 'text-red-600 font-medium'
                            : Number(s.diferencia) > 0
                              ? 'text-blue-600 font-medium'
                              : 'text-green-600'
                        }
                      >
                        {Number(s.diferencia) >= 0 ? '+' : ''}
                        {fmt(Number(s.diferencia))}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 pl-3 text-center">
                    <Badge
                      variant={s.estado === 'ABIERTA' ? 'default' : 'secondary'}
                      className={
                        s.estado === 'ABIERTA'
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : ''
                      }
                    >
                      {s.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada'}
                    </Badge>
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
