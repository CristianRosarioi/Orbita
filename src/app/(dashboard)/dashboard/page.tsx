import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Users,
  Package,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Banknote,
  BarChart2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MoneyDisplay } from '@/components/shared/money-display';

function diasRestantes(fecha: Date | null): number | null {
  if (!fecha) return null;
  const diff = fecha.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const usuario = await prisma.usuario.findFirst({
    where: { clerkId: userId, deletedAt: null },
    select: { id: true, nombre: true, apellido: true },
  });
  if (!usuario) redirect('/sign-in');

  const sesion = await prisma.sesionUsuarioEmpresa.findUnique({
    where: { usuarioId: usuario.id },
    include: {
      empresaActiva: {
        select: {
          nombre: true,
          nombreComercial: true,
          industria: true,
          modoFiscal: true,
          estadoSusc: true,
          trialFinaliza: true,
          planSuscripcion: true,
        },
      },
    },
  });
  if (!sesion) redirect('/onboarding');

  const empresa = sesion.empresaActiva;
  const empresaId = sesion.empresaActivaId;

  const ahora = new Date();
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const hoyFin = new Date();
  hoyFin.setHours(23, 59, 59, 999);
  const mesInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const mesFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

  const [
    facturasHoyData,
    clientesActivos,
    productosActivos,
    facturasMes,
    pagosMes,
    facturasVencidas,
    productosStockBajoRaw,
  ] = await Promise.all([
    prisma.factura
      .findMany({
        where: {
          empresaId,
          deletedAt: null,
          estado: { in: ['PAGADA', 'EMITIDA'] },
          fechaEmision: { gte: hoyInicio, lte: hoyFin },
        },
        select: { total: true },
      })
      .catch(() => []),
    prisma.cliente.count({ where: { empresaId, deletedAt: null, activo: true } }).catch(() => 0),
    prisma.producto.count({ where: { empresaId, deletedAt: null, activo: true } }).catch(() => 0),
    prisma.factura
      .findMany({
        where: {
          empresaId,
          deletedAt: null,
          estado: { in: ['PAGADA', 'EMITIDA'] },
          fechaEmision: { gte: mesInicio, lte: mesFin },
        },
        select: { total: true, saldo: true, estado: true },
      })
      .catch(() => []),
    prisma.pagoFactura
      .findMany({
        where: { empresaId, fechaPago: { gte: mesInicio, lte: mesFin } },
        select: { monto: true },
      })
      .catch(() => []),
    prisma.factura
      .count({
        where: { empresaId, deletedAt: null, estado: 'EMITIDA', fechaVencimiento: { lt: ahora } },
      })
      .catch(() => 0),
    prisma.producto
      .findMany({
        where: { empresaId, deletedAt: null, activo: true, tipo: 'BIEN', stockMinimo: { gt: 0 } },
        select: { nombre: true, stockActual: true, stockMinimo: true },
      })
      .catch(() => []),
  ]);

  const ventasHoy = facturasHoyData.reduce((s, f) => s + Number(f.total), 0);
  const facturasHoyCount = facturasHoyData.length;
  const totalFacturadoMes = facturasMes.reduce((s, f) => s + Number(f.total), 0);
  const totalCobradoMes = pagosMes.reduce((s, p) => s + Number(p.monto), 0);
  const pendienteCobrar = facturasMes
    .filter((f) => f.estado === 'EMITIDA')
    .reduce((s, f) => s + Number(f.saldo), 0);
  const productosStockBajo = productosStockBajoRaw.filter(
    (p) => Number(p.stockActual) <= Number(p.stockMinimo),
  );

  const trial = diasRestantes(empresa.trialFinaliza);
  const hayAlertas = facturasVencidas > 0 || productosStockBajo.length > 0;

  const mesNombre = ahora.toLocaleDateString('es-DO', { month: 'long' });
  const horaActual = ahora.getHours();
  const saludo =
    horaActual < 12 ? 'Buenos días' : horaActual < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {saludo}{usuario.nombre ? `, ${usuario.nombre}` : ''}
        </h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <p className="text-sm text-slate-500">{empresa.nombreComercial ?? empresa.nombre}</p>
          <span className="text-slate-300 text-xs">·</span>
          <span className="text-xs text-slate-400">
            Modo {empresa.modoFiscal === 'FISCAL' ? 'Fiscal' : 'Simple'}
          </span>
          {empresa.estadoSusc === 'TRIAL' && trial !== null && trial > 0 && (
            <span className="text-xs text-amber-500">· Trial: {trial} días</span>
          )}
        </div>
      </div>

      {/* Cards de métricas hoy */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Ventas del día</p>
            <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            <MoneyDisplay amount={ventasHoy} currency="RD$" />
          </p>
          <p className="text-xs text-slate-400">Facturas emitidas y pagadas hoy</p>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Clientes</p>
            <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{clientesActivos}</p>
          <p className="text-xs text-slate-400">Clientes activos</p>
        </div>

        <div className="rounded-xl bg-violet-50 border border-violet-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Productos</p>
            <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
              <Package className="h-4 w-4 text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{productosActivos}</p>
          <p className="text-xs text-slate-400">Productos activos</p>
        </div>

        <div className="rounded-xl bg-orange-50 border border-orange-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Facturas hoy</p>
            <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
              <FileText className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{facturasHoyCount}</p>
          <p className="text-xs text-slate-400">Emitidas y pagadas hoy</p>
        </div>
      </div>

      {/* Resumen del mes */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap capitalize">
            Resumen de {mesNombre}
          </h2>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-100 border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total facturado</p>
              <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              <MoneyDisplay amount={totalFacturadoMes} currency="RD$" />
            </p>
            <p className="text-xs text-slate-400">
              {facturasMes.length} factura{facturasMes.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total cobrado</p>
              <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
                <Banknote className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              <MoneyDisplay amount={totalCobradoMes} currency="RD$" />
            </p>
            <p className="text-xs text-slate-400">Pagos recibidos</p>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Pendiente cobrar</p>
              <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              <MoneyDisplay amount={pendienteCobrar} currency="RD$" />
            </p>
            <p className="text-xs text-slate-400">En crédito sin cobrar</p>
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Facturas del mes</p>
              <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
                <BarChart2 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{facturasMes.length}</p>
            <p className="text-xs text-slate-400">Emitidas + pagadas</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Alertas
          </h2>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
        {!hayAlertas ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Todo en orden</p>
              <p className="text-xs text-slate-400">Sin alertas pendientes hoy</p>
            </div>
          </div>
        ) : (
          <Card className="p-5">
            <ul className="space-y-2 text-sm">
              {facturasVencidas > 0 && (
                <li className="flex items-start gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    <strong>{facturasVencidas}</strong> factura{facturasVencidas !== 1 ? 's' : ''}{' '}
                    vencida{facturasVencidas !== 1 ? 's' : ''} sin cobrar.{' '}
                    <Link href="/facturas?estado=EMITIDA" className="underline hover:no-underline">
                      Ver facturas
                    </Link>
                  </span>
                </li>
              )}
              {productosStockBajo.slice(0, 5).map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-red-700">
                  <Package className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    <strong>{p.nombre}</strong>: stock {Number(p.stockActual)} (mínimo{' '}
                    {Number(p.stockMinimo)}).
                  </span>
                </li>
              ))}
              {productosStockBajo.length > 5 && (
                <li className="text-slate-500 ml-6">
                  Y {productosStockBajo.length - 5} producto
                  {productosStockBajo.length - 5 !== 1 ? 's' : ''} más con stock bajo.{' '}
                  <Link href="/productos" className="underline hover:no-underline">
                    Ver todos
                  </Link>
                </li>
              )}
            </ul>
          </Card>
        )}
      </div>

      {/* Próximos pasos */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Próximos pasos
          </h2>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
        <Card className="p-5">
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="text-green-500 text-base">✓</span> Tu empresa fue creada
            </li>
            <li className="flex items-center gap-2 text-slate-400">
              <span className="text-base">○</span>{' '}
              <Link href="/productos" className="hover:underline">
                Agrega tu primer producto
              </Link>
            </li>
            <li className="flex items-center gap-2 text-slate-400">
              <span className="text-base">○</span>{' '}
              <Link href="/clientes" className="hover:underline">
                Registra tu primer cliente
              </Link>
            </li>
            <li className="flex items-center gap-2 text-slate-400">
              <span className="text-base">○</span>{' '}
              <Link href="/facturas/nueva" className="hover:underline">
                Emite tu primera factura
              </Link>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
