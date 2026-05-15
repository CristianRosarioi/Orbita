import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { getCurrentEmpresa } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { ProductoForm } from '../_components/producto-form';

export default async function NuevoProductoPage() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const empresaId = sesion.empresaActivaId;

  const [categorias, unidades] = await Promise.all([
    prisma.categoria.findMany({
      where: { empresaId, deletedAt: null, activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.unidadMedida.findMany({
      where: { empresaId, deletedAt: null, activa: true },
      select: { id: true, nombre: true, abreviatura: true },
      orderBy: { nombre: 'asc' },
    }),
  ]);

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/productos" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo producto</h1>
          <p className="text-slate-500 text-sm mt-0.5">Agrega un bien o servicio a tu catálogo</p>
        </div>
      </div>

      <Card className="p-6">
        <ProductoForm categorias={categorias} unidades={unidades} />
      </Card>
    </div>
  );
}
