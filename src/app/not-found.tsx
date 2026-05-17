import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
      <div className="space-y-8 max-w-sm w-full">
        <div className="flex items-center justify-center gap-2">
          <Building2 className="h-7 w-7 text-slate-800" />
          <span className="text-2xl font-bold text-slate-900">Órbita</span>
        </div>

        <div className="space-y-2">
          <p className="text-7xl font-extrabold text-slate-200">404</p>
          <h1 className="text-xl font-semibold text-slate-800">Página no encontrada</h1>
          <p className="text-slate-500 text-sm">
            El contenido que buscas no existe o fue movido.
          </p>
        </div>

        <Link href="/" className={buttonVariants({ size: 'lg' })}>
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
