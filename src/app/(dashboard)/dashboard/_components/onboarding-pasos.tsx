'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, Package, Users, FileText, X } from 'lucide-react';
import { ocultarOnboarding } from '../actions';

interface OnboardingPasosProps {
  tieneProducto: boolean;
  tieneCliente: boolean;
  tieneFactura: boolean;
}

export function OnboardingPasos({
  tieneProducto,
  tieneCliente,
  tieneFactura,
}: OnboardingPasosProps) {
  const [oculto, setOculto] = useState(false);
  const [pending, startTransition] = useTransition();

  // Si los cuatro pasos están completos, no renderizar nada.
  if (tieneProducto && tieneCliente && tieneFactura) return null;
  if (oculto) return null;

  function handleOcultar() {
    setOculto(true); // feedback inmediato
    startTransition(async () => {
      await ocultarOnboarding();
    });
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          Próximos pasos
        </h2>
        <div className="flex-1 h-px bg-slate-100" />
        <button
          type="button"
          onClick={handleOcultar}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
          aria-label="Ocultar próximos pasos"
        >
          <X className="h-3.5 w-3.5" />
          Ocultar
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Paso 1: empresa creada — siempre completo */}
        <PasoCompleto label="Tu empresa fue creada" />

        {/* Paso 2: producto */}
        {tieneProducto ? (
          <PasoCompleto label="Agregaste tu primer producto" />
        ) : (
          <PasoPendiente href="/productos/nuevo" label="Agrega tu primer producto" icon={Package} />
        )}

        {/* Paso 3: cliente */}
        {tieneCliente ? (
          <PasoCompleto label="Registraste tu primer cliente" />
        ) : (
          <PasoPendiente href="/clientes/nuevo" label="Registra tu primer cliente" icon={Users} />
        )}

        {/* Paso 4: factura */}
        {tieneFactura ? (
          <PasoCompleto label="Emitiste tu primera factura" />
        ) : (
          <PasoPendiente href="/facturas/nueva" label="Emite tu primera factura" icon={FileText} />
        )}
      </div>
    </div>
  );
}

function PasoCompleto({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 mb-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      </div>
      <p className="text-sm font-medium text-slate-400 line-through">{label}</p>
    </div>
  );
}

function PasoPendiente({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 hover:bg-indigo-100 transition-colors"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-indigo-200 mb-3">
        <Icon className="h-4 w-4 text-indigo-500" />
      </div>
      <p className="text-sm font-medium text-indigo-800">{label}</p>
    </Link>
  );
}
