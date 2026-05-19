import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users, Plus, Pencil } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

const ESTADO_COLORS: Record<string, string> = {
  ACTIVO: 'bg-emerald-100 text-emerald-700',
  INACTIVO: 'bg-slate-100 text-slate-600',
  SUSPENDIDO: 'bg-amber-100 text-amber-700',
  TERMINADO: 'bg-red-100 text-red-700',
};

const ESTADO_LABELS: Record<string, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  SUSPENDIDO: 'Suspendido',
  TERMINADO: 'Terminado',
};

const CONTRATO_LABELS: Record<string, string> = {
  INDEFINIDO: 'Indefinido',
  DETERMINADO: 'Determinado',
  POR_OBRA: 'Por obra',
  TEMPORAL: 'Temporal',
};

export default async function EmpleadosPage() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const empleados = await prisma.empleado.findMany({
    where: { empresaId: sesion.empresaActivaId, deletedAt: null },
    orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    select: {
      id: true,
      nombre: true,
      apellido: true,
      cedula: true,
      cargo: true,
      departamento: true,
      salarioBase: true,
      tipoContrato: true,
      frecuenciaPago: true,
      estado: true,
    },
  });

  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Empleados</h1>
          <p className="text-slate-500 text-sm mt-1">
            {empleados.length} empleado{empleados.length !== 1 ? 's' : ''} registrado
            {empleados.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/nomina/empleados/nuevo" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo empleado
        </Link>
      </div>

      {empleados.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-16 text-center text-slate-500">
          <Users className="mx-auto h-10 w-10 mb-3 text-slate-300" />
          <p className="font-medium">Sin empleados registrados</p>
          <p className="text-sm mt-1">Agrega tu primer empleado para comenzar con la nómina.</p>
          <Link href="/nomina/empleados/nuevo" className={buttonVariants() + ' mt-4'}>
            <Plus className="h-4 w-4 mr-1.5" />
            Agregar empleado
          </Link>
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Empleado</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Cédula</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Cargo</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Contrato</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Salario base</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {emp.apellido}, {emp.nombre}
                    {emp.departamento && (
                      <span className="ml-2 text-xs text-slate-400">{emp.departamento}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{emp.cedula}</td>
                  <td className="px-4 py-3 text-slate-700">{emp.cargo}</td>
                  <td className="px-4 py-3 text-slate-500">{CONTRATO_LABELS[emp.tipoContrato]}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    RD${' '}
                    {Number(emp.salarioBase).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={ESTADO_COLORS[emp.estado]}>{ESTADO_LABELS[emp.estado]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/nomina/empleados/${emp.id}/editar`}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
