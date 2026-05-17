import { redirect } from 'next/navigation';
import { getOrCreateDbUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OnboardingWizard } from './onboarding-wizard';

export const metadata = { title: 'Configura tu empresa — Órbita' };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // Si llega con token de invitación, redirigir a la página de invitación
  if (token) redirect(`/invitacion?token=${token}`);

  const usuario = await getOrCreateDbUser();
  if (!usuario) redirect('/sign-in');

  const sesion = await prisma.sesionUsuarioEmpresa.findUnique({
    where: { usuarioId: usuario.id },
    select: { id: true },
  });
  if (sesion) redirect('/dashboard');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8 space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Configura tu empresa</h1>
          <p className="text-slate-500 text-sm">Solo toma 2 minutos — te guiamos paso a paso</p>
        </div>
        <OnboardingWizard />
      </div>
    </div>
  );
}
