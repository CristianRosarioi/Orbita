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
import { MoneyDisplay } from '@/components/shared/money-display';
import { OnboardingPasos } from './_components/onboarding-pasos';

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
          onboardingOculto: true,
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
    onboardingProductos,
    onboardingClientes,
    onboardingFacturas,
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
    // Onboarding: estado real de cada paso (independiente de filtros activo/fecha)
    prisma.producto.count({ where: { empresaId, deletedAt: null } }).catch(() => 0),
    prisma.cliente.count({ where: { empresaId, deletedAt: null } }).catch(() => 0),
    prisma.factura
      .count({ where: { empresaId, deletedAt: null, estado: { in: ['EMITIDA', 'PAGADA'] } } })
      .catch(() => 0),
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

  // Fecha de hoy en formato YYYY-MM-DD para preseleccionar el filtro de Facturas
  const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(
    ahora.getDate(),
  ).padStart(2, '0')}`;
  const facturasHoyHref = `/facturas?desde=${hoyStr}&hasta=${hoyStr}`;

  const mesNombre = ahora.toLocaleDateString('es-DO', { month: 'long' });
  const horaActual = ahora.getHours();
  const saludo =
    horaActual < 12 ? 'Buenos días' : horaActual < 19 ? 'Buenas tardes' : 'Buenas noches';
  const fechaFormateada = ahora.toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {saludo}
          {usuario.nombre ? `, ${usuario.nombre}` : ''}
        </h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <p className="text-sm text-slate-500">{empresa.nombreComercial ?? empresa.nombre}</p>
          <span className="text-slate-300 text-xs">·</span>
          <span className="text-xs text-slate-400">
            Modo {empresa.modoFiscal === 'FISCAL' ? 'Fiscal' : 'Simple'}
          </span>
          {empresa.estadoSusc === 'TRIAL' && trial !== null && trial > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              ⏳ Trial: {trial} días restantes
            </span>
          )}
          {empresa.estadoSusc === 'ACTIVA' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              ✓ Plan activo
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 mt-1 capitalize">{fechaFormateada}</p>
      </div>

      {/* Cards de métricas hoy */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={facturasHoyHref}
          className="block rounded-xl bg-emerald-50 border border-emerald-100 border-l-4 border-l-emerald-400 p-5 space-y-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400"
        >
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
        </Link>

        <Link
          href="/clientes"
          className="block rounded-xl bg-blue-50 border border-blue-100 border-l-4 border-l-blue-400 p-5 space-y-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Clientes</p>
            <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{clientesActivos}</p>
          <p className="text-xs text-slate-400">Clientes activos</p>
        </Link>

        <Link
          href="/productos"
          className="block rounded-xl bg-violet-50 border border-violet-100 border-l-4 border-l-violet-400 p-5 space-y-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-400"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Productos</p>
            <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
              <Package className="h-4 w-4 text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{productosActivos}</p>
          <p className="text-xs text-slate-400">Productos activos</p>
        </Link>

        <Link
          href={facturasHoyHref}
          className="block rounded-xl bg-orange-50 border border-orange-100 border-l-4 border-l-orange-400 p-5 space-y-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-400"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Facturas hoy</p>
            <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
              <FileText className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{facturasHoyCount}</p>
          <p className="text-xs text-slate-400">Emitidas y pagadas hoy</p>
        </Link>
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
          <Link
            href="/facturas"
            className="block rounded-xl bg-slate-100 border border-slate-200 border-l-4 border-l-slate-400 p-5 space-y-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
          >
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
          </Link>

          <Link
            href="/facturas?estado=PAGADA"
            className="block rounded-xl bg-emerald-50 border border-emerald-100 border-l-4 border-l-emerald-400 p-5 space-y-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400"
          >
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
          </Link>

          <Link
            href="/facturas?estado=EMITIDA"
            className="block rounded-xl bg-amber-50 border border-amber-100 border-l-4 border-l-amber-400 p-5 space-y-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400"
          >
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
          </Link>

          <Link
            href="/facturas"
            className="block rounded-xl bg-blue-50 border border-blue-100 border-l-4 border-l-blue-400 p-5 space-y-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Facturas del mes</p>
              <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center">
                <BarChart2 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{facturasMes.length}</p>
            <p className="text-xs text-slate-400">Emitidas + pagadas</p>
          </Link>
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
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Todo en orden</p>
              <p className="text-xs text-emerald-600">Sin alertas pendientes hoy</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {facturasVencidas > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-amber-800">
                    {facturasVencidas} factura{facturasVencidas !== 1 ? 's' : ''} vencida
                    {facturasVencidas !== 1 ? 's' : ''} sin cobrar
                  </p>
                  <Link
                    href="/facturas?estado=EMITIDA"
                    className="text-xs text-amber-700 underline hover:no-underline"
                  >
                    Ver facturas pendientes
                  </Link>
                </div>
              </div>
            )}
            {productosStockBajo.slice(0, 5).map((p, i) => (
              <div
                key={i}
                className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Package className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-red-800">{p.nombre}</p>
                  <p className="text-xs text-red-600">
                    Stock actual: {Number(p.stockActual)} — Mínimo: {Number(p.stockMinimo)}
                  </p>
                </div>
              </div>
            ))}
            {productosStockBajo.length > 5 && (
              <p className="text-sm text-slate-500 pl-2">
                Y {productosStockBajo.length - 5} producto
                {productosStockBajo.length - 5 !== 1 ? 's' : ''} más con stock bajo.{' '}
                <Link href="/productos" className="underline hover:no-underline">
                  Ver todos
                </Link>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Próximos pasos (onboarding) — se oculta al completar los 4 pasos o al descartarlo */}
      {!empresa.onboardingOculto && (
        <OnboardingPasos
          tieneProducto={onboardingProductos > 0}
          tieneCliente={onboardingClientes > 0}
          tieneFactura={onboardingFacturas > 0}
        />
      )}
    </div>
  );
}
