import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Users, Package, FileText, TrendingUp } from 'lucide-react';
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

  // Real-time stats for today
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const hoyFin = new Date();
  hoyFin.setHours(23, 59, 59, 999);

  const [facturasHoyData, clientesActivos, productosActivos] = await Promise.all([
    prisma.factura.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        deletedAt: null,
        estado: { in: ['PAGADA', 'EMITIDA'] },
        fechaEmision: { gte: hoyInicio, lte: hoyFin },
      },
      select: { total: true },
    }).catch(() => []),
    prisma.cliente.count({
      where: { empresaId: sesion.empresaActivaId, deletedAt: null, activo: true },
    }).catch(() => 0),
    prisma.producto.count({
      where: { empresaId: sesion.empresaActivaId, deletedAt: null, activo: true },
    }).catch(() => 0),
  ]);

  const ventasHoy = facturasHoyData.reduce((sum, f) => sum + Number(f.total), 0);
  const facturasHoyCount = facturasHoyData.length;
  const trial = diasRestantes(empresa.trialFinaliza);
  const nombreCompleto = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          ¡Bienvenido{nombreCompleto ? `, ${usuario.nombre}` : ''}!
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {empresa.nombreComercial ?? empresa.nombre} — {empresa.industria.replace(/_/g, ' ')}
        </p>
      </div>

      {/* Banner de trial */}
      {empresa.estadoSusc === 'TRIAL' && trial !== null && (
        <div
          className={`rounded-lg px-4 py-3 text-sm flex items-center justify-between ${
            trial <= 3
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          <span>
            {trial === 0
              ? 'Tu período de prueba terminó hoy.'
              : `Tu período de prueba vence en ${trial} día${trial === 1 ? '' : 's'}.`}
          </span>
          <a
            href="/configuracion/suscripcion"
            className="font-semibold underline hover:no-underline"
          >
            Activar plan
          </a>
        </div>
      )}

      {/* Modo fiscal */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 text-sm">
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            empresa.modoFiscal === 'FISCAL' ? 'bg-green-500' : 'bg-slate-400'
          }`}
        />
        <span className="text-slate-600">
          Modo{' '}
          {empresa.modoFiscal === 'FISCAL'
            ? 'Fiscal — cumplimiento DGII activo'
            : 'Simple — sin comprobantes fiscales'}
        </span>
        {empresa.modoFiscal === 'SIMPLE' && (
          <a
            href="/configuracion/fiscal"
            className="ml-auto text-slate-900 font-medium hover:underline"
          >
            Activar modo fiscal
          </a>
        )}
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ventas del día</p>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            <MoneyDisplay amount={ventasHoy} currency="RD$" />
          </p>
          <p className="text-xs text-slate-400">Facturas emitidas y pagadas hoy</p>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Clientes</p>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{clientesActivos}</p>
          <p className="text-xs text-slate-400">Clientes activos</p>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Productos</p>
            <Package className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{productosActivos}</p>
          <p className="text-xs text-slate-400">Productos activos</p>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Facturas hoy</p>
            <FileText className="h-4 w-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{facturasHoyCount}</p>
          <p className="text-xs text-slate-400">Emitidas y pagadas hoy</p>
        </Card>
      </div>

      {/* Próximos pasos */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Próximos pasos</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <span className="text-green-500 text-base">✓</span> Tu empresa fue creada
          </li>
          <li className="flex items-center gap-2 text-slate-400">
            <span className="text-base">○</span> <Link href="/productos" className="hover:underline">Agrega tu primer producto</Link>
          </li>
          <li className="flex items-center gap-2 text-slate-400">
            <span className="text-base">○</span> <Link href="/clientes" className="hover:underline">Registra tu primer cliente</Link>
          </li>
          <li className="flex items-center gap-2 text-slate-400">
            <span className="text-base">○</span> <Link href="/facturas/nueva" className="hover:underline">Emite tu primera factura</Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}
