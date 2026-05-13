import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Building2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    const usuario = await prisma.usuario.findFirst({
      where: { clerkId: userId, deletedAt: null },
      select: { id: true },
    });

    if (usuario) {
      const sesion = await prisma.sesionUsuarioEmpresa.findUnique({
        where: { usuarioId: usuario.id },
        select: { id: true },
      });
      redirect(sesion ? '/dashboard' : '/onboarding');
    } else {
      redirect('/onboarding');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="text-center space-y-8 max-w-md">
        <div className="flex items-center justify-center gap-2">
          <Building2 className="h-8 w-8 text-slate-700" />
          <span className="text-3xl font-bold tracking-tight text-slate-900">Órbita</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-slate-900">Sistema de Gestión Empresarial</h1>
          <p className="text-slate-500">
            Facturación, inventario y cumplimiento DGII para negocios dominicanos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/sign-in"
            className={buttonVariants({ className: 'bg-slate-900 hover:bg-slate-700' })}
          >
            Iniciar sesión
          </Link>
          <Link href="/sign-up" className={buttonVariants({ variant: 'outline' })}>
            Crear cuenta gratis
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-6 text-slate-400 text-xs">© 2026 Órbita RD</footer>
    </main>
  );
}
