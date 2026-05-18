import { redirect } from 'next/navigation';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import NuevaNoMminaForm from './_form';

export default async function NuevaNominaPage() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const empleados = await prisma.empleado.findMany({
    where: { empresaId: sesion.empresaActivaId, estado: 'ACTIVO', deletedAt: null },
    orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    select: { id: true, nombre: true, apellido: true, cargo: true, salarioBase: true },
  });

  return <NuevaNoMminaForm empleados={empleados} />;
}
