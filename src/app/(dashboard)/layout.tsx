import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SidebarDashboard } from '@/components/layout/sidebar-dashboard';
import { DashboardHeader } from '@/components/layout/dashboard-header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Verificar que el usuario tiene empresa activa
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
          id: true,
          nombre: true,
          nombreComercial: true,
          industria: true,
          estadoSusc: true,
          trialFinaliza: true,
        },
      },
      sucursalActiva: { select: { id: true, nombre: true } },
    },
  });

  // Si no tiene empresa configurada, enviar a onboarding
  if (!sesion) redirect('/onboarding');

  const membresia = await prisma.miembroEmpresa.findFirst({
    where: { usuarioId: usuario.id, empresaId: sesion.empresaActivaId, activo: true },
    select: { rol: true },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <SidebarDashboard
        empresa={sesion.empresaActiva}
        sucursal={sesion.sucursalActiva}
        rol={membresia?.rol ?? 'VIEWER'}
        usuario={usuario}
      />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
