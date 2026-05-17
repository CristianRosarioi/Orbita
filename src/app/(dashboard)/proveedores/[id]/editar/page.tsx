import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { getCurrentEmpresa } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { ProveedorForm } from '../../_components/proveedor-form';
import type { CreateProveedorInput } from '@/lib/validations/proveedores';
import { TipoIdentificacion } from '@/types/enums';

export default async function EditarProveedorPage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const { id } = await params;

  const proveedor = await prisma.proveedor.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
  });

  if (!proveedor) notFound();

  const defaultValues: Partial<CreateProveedorInput> = {
    tipoIdentificacion: proveedor.tipoIdentificacion as TipoIdentificacion,
    identificacion: proveedor.identificacion ?? undefined,
    nombre: proveedor.nombre,
    nombreComercial: proveedor.nombreComercial ?? undefined,
    contacto: proveedor.contacto ?? undefined,
    email: proveedor.email ?? undefined,
    telefono: proveedor.telefono ?? undefined,
    celular: proveedor.celular ?? undefined,
    direccion: proveedor.direccion ?? undefined,
    ciudad: proveedor.ciudad ?? undefined,
    provincia: proveedor.provincia ?? undefined,
    notas: proveedor.notas ?? undefined,
    diasCredito: proveedor.diasCredito,
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/proveedores/${id}`} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Editar proveedor</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {proveedor.nombreComercial ?? proveedor.nombre}
          </p>
        </div>
      </div>

      <Card className="p-4 md:p-6">
        <ProveedorForm defaultValues={defaultValues} proveedorId={id} />
      </Card>
    </div>
  );
}
