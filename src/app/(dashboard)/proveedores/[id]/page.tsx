import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { getCurrentEmpresa } from '@/lib/auth';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const LABEL_IDENT: Record<string, string> = {
  CEDULA: 'Cédula',
  RNC: 'RNC',
  PASAPORTE: 'Pasaporte',
  SIN_IDENTIFICACION: 'Sin identificación',
};

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-900">{valor || '—'}</p>
    </div>
  );
}

export default async function ProveedorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const { id } = await params;

  const proveedor = await prisma.proveedor.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
  });

  if (!proveedor) notFound();

  const fechaCreacion = new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(proveedor.createdAt);

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/proveedores" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {proveedor.nombreComercial ?? proveedor.nombre}
            </h1>
            {proveedor.nombreComercial && (
              <p className="text-slate-500 text-sm">{proveedor.nombre}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={proveedor.activo ? 'default' : 'secondary'} className="text-xs">
                {proveedor.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </div>
        <Link href={`/proveedores/${id}/editar`} className={buttonVariants({ variant: 'outline' })}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Link>
      </div>

      {/* Datos generales */}
      <Card className="p-6 space-y-5">
        <h2 className="font-semibold text-slate-900">Datos generales</h2>
        <Separator />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo
            label="Identificación"
            valor={
              proveedor.identificacion
                ? `${LABEL_IDENT[proveedor.tipoIdentificacion]}: ${proveedor.identificacion}`
                : LABEL_IDENT[proveedor.tipoIdentificacion]
            }
          />
          <Campo label="Persona de contacto" valor={proveedor.contacto} />
          <Campo label="Email" valor={proveedor.email} />
          <Campo label="Teléfono" valor={proveedor.telefono} />
          <Campo label="Celular" valor={proveedor.celular} />
          <Campo
            label="Días de crédito"
            valor={`${proveedor.diasCredito} ${proveedor.diasCredito === 1 ? 'día' : 'días'}`}
          />
          <Campo label="Ciudad" valor={proveedor.ciudad} />
          <Campo label="Provincia" valor={proveedor.provincia} />
        </div>
        {proveedor.direccion && <Campo label="Dirección" valor={proveedor.direccion} />}
        {proveedor.notas && <Campo label="Notas internas" valor={proveedor.notas} />}
      </Card>

      <p className="text-xs text-slate-400">Proveedor creado el {fechaCreacion}</p>
    </div>
  );
}
