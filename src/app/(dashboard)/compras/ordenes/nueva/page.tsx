import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrdenForm } from './_components/orden-form';

export default async function NuevaOrdenPage() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const proveedores = await prisma.proveedor.findMany({
    where: { empresaId: sesion.empresaActivaId, deletedAt: null, activo: true },
    select: { id: true, nombre: true, nombreComercial: true },
    orderBy: { nombre: 'asc' },
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link
          href="/compras/ordenes"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Nueva orden de compra
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Se guardará como borrador hasta que la envíes
          </p>
        </div>
      </div>

      <OrdenForm proveedores={proveedores} />
    </div>
  );
}
