import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Building2, FileText, Package, BarChart2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

const FEATURES = [
  {
    icon: FileText,
    titulo: 'Facturación con NCF',
    desc: 'Emite facturas con comprobantes fiscales válidos ante la DGII. Soporte para B01, B02, B14 y más.',
  },
  {
    icon: Package,
    titulo: 'Inventario automático',
    desc: 'El stock se actualiza en tiempo real al facturar. Alertas de stock bajo y movimientos automáticos.',
  },
  {
    icon: BarChart2,
    titulo: 'Reportes DGII',
    desc: 'Genera los reportes 606, 607 y 608 en formato TXT y Excel listos para subir a la DGII.',
  },
];

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
    <main className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-slate-800" />
          <span className="text-xl font-bold text-slate-900">Órbita</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Iniciar sesión
          </Link>
          <Link href="/sign-up" className={buttonVariants({ size: 'sm' })}>
            Crear cuenta
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1.5 text-sm text-slate-600 font-medium">
            <Building2 className="h-4 w-4" />
            Para negocios dominicanos
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold text-slate-900 leading-tight">
              Órbita — Sistema de
              <br />
              Gestión Empresarial
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed">
              Facturación, inventario y cumplimiento DGII para negocios dominicanos. Todo en un solo
              lugar, sin complicaciones.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sign-up"
              className={buttonVariants({
                size: 'lg',
                className: 'bg-slate-900 hover:bg-slate-700 text-white text-base px-8',
              })}
            >
              Crear cuenta gratis — 14 días
            </Link>
            <Link
              href="/sign-in"
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
                className: 'text-base px-8',
              })}
            >
              Iniciar sesión
            </Link>
          </div>
          <p className="text-xs text-slate-400">Sin tarjeta de crédito. Cancela cuando quieras.</p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-100 bg-slate-50 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-slate-900 mb-10">
            Todo lo que tu negocio necesita
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, titulo, desc }) => (
              <div
                key={titulo}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="font-semibold text-slate-900">{titulo}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 text-center text-slate-400 text-xs">
        © 2026 Órbita RD · República Dominicana
      </footer>
    </main>
  );
}
