import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, Phone, FileText } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import CitaAcciones from './_components/cita-acciones';

const INDUSTRIAS_SALON = ['SALON_BARBERIA'];

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_SHOW: 'No se presentó',
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-slate-100 text-slate-600',
  CONFIRMADA: 'bg-blue-100 text-blue-700',
  EN_PROCESO: 'bg-amber-100 text-amber-700',
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-red-100 text-red-600',
  NO_SHOW: 'bg-slate-100 text-slate-500',
};

export default async function CitaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_SALON.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  const { id } = await params;
  const cita = await prisma.cita.findFirst({
    where: { id, empresaId: sesion.empresaActivaId },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true, email: true } },
    },
  });

  if (!cita) notFound();

  const fecha = new Date(cita.fecha);
  const cerrado =
    cita.estado === 'COMPLETADA' || cita.estado === 'CANCELADA' || cita.estado === 'NO_SHOW';

  return (
    <div className="p-4 space-y-6 md:p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/salon/citas" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{cita.servicio}</h1>
            <p className="text-slate-500 text-sm mt-0.5">Cita • {cita.clienteNombre}</p>
          </div>
        </div>
        <Badge className={ESTADO_COLORS[cita.estado]}>{ESTADO_LABELS[cita.estado]}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Información principal */}
        <div className="md:col-span-2 space-y-4">
          {/* Fecha y hora */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Detalles del servicio
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Fecha</p>
                  <p className="text-sm font-medium text-slate-900">
                    {fecha.toLocaleDateString('es-DO', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Hora</p>
                  <p className="text-sm font-medium text-slate-900">
                    {fecha.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Duración</p>
                  <p className="text-sm font-medium text-slate-900">
                    {cita.duracionMin < 60
                      ? `${cita.duracionMin} min`
                      : `${Math.floor(cita.duracionMin / 60)}h${cita.duracionMin % 60 ? ` ${cita.duracionMin % 60}min` : ''}`}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500">Precio</p>
                <p className="text-lg font-bold text-slate-900">
                  RD$ {Number(cita.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {cita.notas && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Notas</p>
                    <p className="text-sm text-slate-700 mt-0.5">{cita.notas}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          {!cerrado && (
            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Acciones
              </h2>
              <CitaAcciones citaId={cita.id} estado={cita.estado} />
            </div>
          )}

          {cerrado && cita.estado === 'COMPLETADA' && (
            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Facturación
              </h2>
              <CitaAcciones citaId={cita.id} estado={cita.estado} />
            </div>
          )}
        </div>

        {/* Panel lateral: cliente */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Cliente
            </h2>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{cita.clienteNombre}</p>
                  {cita.cliente && (
                    <Link
                      href={`/clientes/${cita.cliente.id}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Ver perfil
                    </Link>
                  )}
                </div>
              </div>
              {cita.clienteTelefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <p className="text-sm text-slate-700">{cita.clienteTelefono}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-2">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Historial
            </h2>
            <p className="text-xs text-slate-500">
              Creada: {new Date(cita.createdAt).toLocaleDateString('es-DO')}
            </p>
            <p className="text-xs text-slate-500">
              Actualizada: {new Date(cita.updatedAt).toLocaleDateString('es-DO')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
