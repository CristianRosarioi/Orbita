import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Users, Package, FileText, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
        <div className={`rounded-lg px-4 py-3 text-sm flex items-center justify-between ${
          trial <= 3 ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <span>
            {trial === 0
              ? 'Tu período de prueba terminó hoy.'
              : `Tu período de prueba vence en ${trial} día${trial === 1 ? '' : 's'}.`}
          </span>
          <a href="/configuracion/suscripcion" className="font-semibold underline hover:no-underline">
            Activar plan
          </a>
        </div>
      )}

      {/* Modo fiscal */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 text-sm">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          empresa.modoFiscal === 'FISCAL' ? 'bg-green-500' : 'bg-slate-400'
        }`} />
        <span className="text-slate-600">
          Modo {empresa.modoFiscal === 'FISCAL' ? 'Fiscal — cumplimiento DGII activo' : 'Simple — sin comprobantes fiscales'}
        </span>
        {empresa.modoFiscal === 'SIMPLE' && (
          <a href="/configuracion/fiscal" className="ml-auto text-slate-900 font-medium hover:underline">
            Activar modo fiscal
          </a>
        )}
      </div>

      {/* Cards de métricas — placeholder hasta Fase 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas del día', valor: 'RD$0.00', icon: TrendingUp, color: 'text-green-600' },
          { label: 'Clientes', valor: '0', icon: Users, color: 'text-blue-600' },
          { label: 'Productos', valor: '0', icon: Package, color: 'text-purple-600' },
          { label: 'Facturas hoy', valor: '0', icon: FileText, color: 'text-orange-600' },
        ].map(({ label, valor, icon: Icon, color }) => (
          <Card key={label} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{valor}</p>
            <p className="text-xs text-slate-400">Se llenará en la Fase 2</p>
          </Card>
        ))}
      </div>

      {/* Próximos pasos */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Próximos pasos</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <span className="text-green-500 text-base">✓</span> Tu empresa fue creada
          </li>
          <li className="flex items-center gap-2 text-slate-400">
            <span className="text-base">○</span> Agrega tu primer producto
          </li>
          <li className="flex items-center gap-2 text-slate-400">
            <span className="text-base">○</span> Registra tu primer cliente
          </li>
          <li className="flex items-center gap-2 text-slate-400">
            <span className="text-base">○</span> Emite tu primera factura
          </li>
        </ul>
      </Card>
    </div>
  );
}
