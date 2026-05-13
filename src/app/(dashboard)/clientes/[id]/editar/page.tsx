import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { getCurrentEmpresa } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { ClienteForm } from '../../_components/cliente-form';
import type { CreateClienteInput } from '@/lib/validations/clientes';
import { TipoCliente, TipoIdentificacion } from '@/types/enums';

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
  });

  if (!cliente) notFound();

  const defaultValues: Partial<CreateClienteInput> = {
    tipo: cliente.tipo as TipoCliente,
    tipoIdentificacion: cliente.tipoIdentificacion as TipoIdentificacion,
    identificacion: cliente.identificacion ?? undefined,
    nombre: cliente.nombre,
    nombreComercial: cliente.nombreComercial ?? undefined,
    email: cliente.email ?? undefined,
    telefono: cliente.telefono ?? undefined,
    celular: cliente.celular ?? undefined,
    direccion: cliente.direccion ?? undefined,
    ciudad: cliente.ciudad ?? undefined,
    provincia: cliente.provincia ?? undefined,
    notas: cliente.notas ?? undefined,
    limiteCredito: Number(cliente.limiteCredito),
    diasCredito: cliente.diasCredito,
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/clientes/${id}`} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar cliente</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {cliente.nombreComercial ?? cliente.nombre}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <ClienteForm defaultValues={defaultValues} clienteId={id} />
      </Card>
    </div>
  );
}
