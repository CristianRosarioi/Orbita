import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { Building2 } from 'lucide-react';

export const metadata = {
  title: 'Iniciar sesión — Órbita',
};

export default function SignInPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel izquierdo — solo visible en desktop */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-10 text-white">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-slate-300" />
          <span className="text-xl font-semibold tracking-tight">Órbita</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">Gestiona tu negocio con claridad</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Facturación, inventario, reportes DGII y más — todo en un solo lugar, diseñado para la
            realidad dominicana.
          </p>
        </div>

        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} Órbita RD. Todos los derechos reservados.
        </p>
      </div>

      {/* Panel derecho — formulario de Clerk */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo mobile */}
          <div className="flex items-center justify-center gap-2 lg:hidden">
            <Building2 className="h-6 w-6 text-slate-700" />
            <span className="text-xl font-semibold text-slate-900">Órbita</span>
          </div>

          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="text-slate-500 text-sm">
              ¿No tienes cuenta?{' '}
              <Link href="/sign-up" className="text-slate-900 font-medium hover:underline">
                Regístrate gratis
              </Link>
            </p>
          </div>

          <SignIn
            forceRedirectUrl="/dashboard"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none p-0 border-0 bg-transparent',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton:
                  'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium',
                dividerLine: 'bg-slate-200',
                dividerText: 'text-slate-400',
                formFieldInput:
                  'border-slate-200 rounded-md focus:ring-slate-900 focus:border-slate-900',
                formButtonPrimary:
                  'bg-slate-900 hover:bg-slate-700 text-white font-medium rounded-md',
                footerActionLink: 'text-slate-900 font-medium hover:underline',
                identityPreviewText: 'text-slate-700',
                formFieldLabel: 'text-slate-700 font-medium',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
