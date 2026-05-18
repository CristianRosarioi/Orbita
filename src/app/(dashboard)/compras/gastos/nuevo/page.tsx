import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GastoForm } from './_components/gasto-form';

export default async function NuevoGastoPage() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const proveedores = await prisma.proveedor.findMany({
    where: { empresaId: sesion.empresaActivaId, deletedAt: null, activo: true },
    select: { id: true, nombre: true, nombreComercial: true },
    orderBy: { nombre: 'asc' },
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/compras/gastos" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registrar gasto</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Registra un gasto operativo con su comprobante fiscal
          </p>
        </div>
      </div>

      <GastoForm proveedores={proveedores} />
    </div>
  );
}
