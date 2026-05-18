import { redirect, notFound } from 'next/navigation';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import EditarEmpleadoForm from './_form';

export default async function EditarEmpleadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const { id } = await params;
  const empleado = await prisma.empleado.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
  });

  if (!empleado) notFound();

  return <EditarEmpleadoForm empleado={empleado} />;
}
