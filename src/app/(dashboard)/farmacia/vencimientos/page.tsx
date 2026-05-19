import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buttonVariants } from '@/components/ui/button';

const INDUSTRIAS_FARMACIA = ['FARMACIA', 'BOTICA', 'DROGUERIA'];

const TABS = [
  { label: 'Próximos 30 días', dias: 30 },
  { label: 'Próximos 60 días', dias: 60 },
  { label: 'Próximos 90 días', dias: 90 },
] as const;

interface SearchParams {
  dias?: string;
  vencidos?: string;
}

function colorDias(dias: number) {
  if (dias < 0) return { card: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-700', texto: 'Vencido' };
  if (dias <= 7) return { card: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-700', texto: `${dias}d` };
  if (dias <= 30) return { card: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-700', texto: `${dias}d` };
  return { card: 'border-emerald-200 bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', texto: `${dias}d` };
}

export default async function VencimientosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_FARMACIA.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const params = await searchParams;
  const verVencidos = params.vencidos === 'true';
  const diasFiltro = verVencidos ? 0 : parseInt(params.dias ?? '30');

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy);
  limite.setDate(hoy.getDate() + diasFiltro);

  const lotes = await prisma.lote.findMany({
    where: {
      empresaId: sesion.empresaActivaId,
      activo: true,
      cantidadActual: { gt: 0 },
      ...(verVencidos
        ? { fechaVencimiento: { lt: hoy } }
        : { fechaVencimiento: { gte: hoy, lte: limite } }),
    },
    include: {
      producto: { select: { id: true, nombre: true, sku: true } },
    },
    orderBy: { fechaVencimiento: 'asc' },
  });

  const lotesConDias = lotes.map((l) => ({
    ...l,
    diasRestantes: Math.ceil((l.fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)),
  }));

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Alertas de vencimiento</h1>
        <p className="text-slate-500 text-sm mt-1">
          Lotes activos ordenados por fecha de vencimiento.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ label, dias }) => (
          <Link
            key={dias}
            href={`/farmacia/vencimientos?dias=${dias}`}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
              !verVencidos && diasFiltro === dias
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/farmacia/vencimientos?vencidos=true"
          className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
            verVencidos
              ? 'bg-red-600 text-white border-red-600'
              : 'border-red-200 text-red-600 hover:bg-red-50'
          }`}
        >
          Ya vencidos
        </Link>
      </div>

      {lotesConDias.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-16 text-center text-slate-500">
          <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-slate-300" />
          <p className="font-medium">Sin alertas para este período</p>
          <p className="text-sm mt-1">No hay lotes que venzan en el período seleccionado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{lotesConDias.length} lote{lotesConDias.length !== 1 ? 's' : ''}</p>
          {lotesConDias.map((lote) => {
            const color = colorDias(lote.diasRestantes);
            return (
              <div
                key={lote.id}
                className={`rounded-lg border p-4 flex items-center gap-4 ${color.card}`}
              >
                {/* Días restantes */}
                <div className="shrink-0 text-center w-16">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-lg font-bold ${color.badge}`}
                  >
                    {color.texto}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{lote.producto.nombre}</p>
                  <p className="text-sm text-slate-600">
                    Lote: <span className="font-mono">{lote.numeroLote}</span>
                    {lote.proveedor && ` · ${lote.proveedor}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vence: {lote.fechaVencimiento.toLocaleDateString('es-DO', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                    {' · '}Disponible: {Number(lote.cantidadActual)} uds.
                  </p>
                </div>

                {/* Acciones */}
                <div className="shrink-0">
                  <Link
                    href={`/productos/${lote.producto.id}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Ver producto
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
