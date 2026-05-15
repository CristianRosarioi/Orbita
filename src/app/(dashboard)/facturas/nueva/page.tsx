import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { FacturaForm } from '../_components/factura-form';

export default async function NuevaFacturaPage() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/facturas"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva factura</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Completa los datos y emite o guarda como borrador
          </p>
        </div>
      </div>

      <FacturaForm />
    </div>
  );
}
