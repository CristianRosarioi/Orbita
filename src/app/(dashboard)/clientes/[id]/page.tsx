import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Pencil, Clock } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { getCurrentEmpresa } from '@/lib/auth';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const LABEL_TIPO: Record<string, string> = { PERSONA: 'Persona', EMPRESA: 'Empresa' };
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

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
  });

  if (!cliente) notFound();

  const fechaCreacion = new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(cliente.createdAt);

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/clientes" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {cliente.nombreComercial ?? cliente.nombre}
            </h1>
            {cliente.nombreComercial && <p className="text-slate-500 text-sm">{cliente.nombre}</p>}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {LABEL_TIPO[cliente.tipo]}
              </Badge>
              <Badge variant={cliente.activo ? 'default' : 'secondary'} className="text-xs">
                {cliente.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </div>
        <Link href={`/clientes/${id}/editar`} className={buttonVariants({ variant: 'outline' })}>
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
              cliente.identificacion
                ? `${LABEL_IDENT[cliente.tipoIdentificacion]}: ${cliente.identificacion}`
                : LABEL_IDENT[cliente.tipoIdentificacion]
            }
          />
          <Campo label="Email" valor={cliente.email} />
          <Campo label="Teléfono" valor={cliente.telefono} />
          <Campo label="Celular" valor={cliente.celular} />
          <Campo label="Ciudad" valor={cliente.ciudad} />
          <Campo label="Provincia" valor={cliente.provincia} />
        </div>
        {cliente.direccion && <Campo label="Dirección" valor={cliente.direccion} />}
        {cliente.notas && <Campo label="Notas internas" valor={cliente.notas} />}
      </Card>

      {/* Crédito */}
      {(Number(cliente.limiteCredito) > 0 || cliente.diasCredito > 0) && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Crédito</h2>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <Campo
              label="Límite de crédito"
              valor={`RD$ ${Number(cliente.limiteCredito).toLocaleString('es-DO', {
                minimumFractionDigits: 2,
              })}`}
            />
            <Campo
              label="Días de crédito"
              valor={`${cliente.diasCredito} ${cliente.diasCredito === 1 ? 'día' : 'días'}`}
            />
          </div>
        </Card>
      )}

      {/* Historial de facturas */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Historial de facturas</h2>
        </div>
        <Separator />
        <div className="rounded-md bg-slate-50 border border-slate-200 p-6 text-center">
          <p className="text-slate-500 text-sm">Disponible en Fase 3</p>
          <p className="text-slate-400 text-xs mt-1">
            El historial de facturas se activará con el módulo de facturación.
          </p>
        </div>
      </Card>

      {/* Metadata */}
      <p className="text-xs text-slate-400">Cliente creado el {fechaCreacion}</p>
    </div>
  );
}
