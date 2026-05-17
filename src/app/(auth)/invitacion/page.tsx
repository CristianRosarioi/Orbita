'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';

const ROL_LABELS: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  CONTADOR: 'Contador',
  CAJERO: 'Cajero',
  VIEWER: 'Solo lectura',
};

interface InvitacionInfo {
  email: string;
  rol: string;
  empresa: { id: string; nombre: string; nombreComercial: string | null };
  invitadoPor: string;
  expiresAt: string;
}

function InvitacionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const token = searchParams.get('token');

  const errorInicial = !token ? 'El link de invitación es inválido o incompleto.' : null;
  const [info, setInfo] = useState<InvitacionInfo | null>(null);
  const [error, setError] = useState<string | null>(errorInicial);
  const [cargando, setCargando] = useState(!errorInicial);
  const [aceptando, setAceptando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/invitaciones/aceptar?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          if (d.success) setInfo(d.data);
          else setError(d.error?.message ?? 'Invitación inválida o expirada.');
          setCargando(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo verificar la invitación.');
          setCargando(false);
        }
      });
    return () => { cancelled = true; };
  }, [token]);

  async function aceptar() {
    if (!token) return;
    setAceptando(true);
    try {
      const res = await fetch('/api/invitaciones/aceptar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      if (d.success) {
        setExito(true);
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setError(d.error?.message ?? 'No se pudo aceptar la invitación.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setAceptando(false);
    }
  }

  const emailUsuario =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const emailCoincide = info && emailUsuario?.toLowerCase() === info.email.toLowerCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
      {cargando ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
          <p className="text-slate-500 text-sm">Verificando invitación...</p>
        </div>
      ) : exito ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-lg font-semibold text-slate-900">¡Invitación aceptada!</p>
          <p className="text-slate-500 text-sm">Redirigiendo al dashboard...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <div>
            <p className="font-semibold text-slate-800">Invitación inválida</p>
            <p className="text-slate-500 text-sm mt-1">{error}</p>
          </div>
          <Link href="/sign-up" className={buttonVariants({ variant: 'outline' })}>
            Crear cuenta
          </Link>
        </div>
      ) : info ? (
        <>
          <div className="text-center space-y-1">
            <p className="text-slate-500 text-sm">Te invitaron a unirte a</p>
            <p className="text-xl font-bold text-slate-900">
              {info.empresa.nombreComercial ?? info.empresa.nombre}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Tu rol</span>
              <span className="font-semibold text-slate-800">{ROL_LABELS[info.rol] ?? info.rol}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Invitado por</span>
              <span className="font-semibold text-slate-800">{info.invitadoPor}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Email</span>
              <span className="font-mono text-xs text-slate-700">{info.email}</span>
            </div>
          </div>

          {!isLoaded ? null : !isSignedIn ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 text-center">
                Crea una cuenta o inicia sesión con <strong>{info.email}</strong> para aceptar.
              </p>
              <Link
                href={`/sign-in?redirect_url=${encodeURIComponent(`/invitacion?token=${token}`)}`}
                className={buttonVariants({ className: 'w-full' })}
              >
                Crear cuenta o iniciar sesión
              </Link>
            </div>
          ) : !emailCoincide ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 text-center space-y-1">
              <p className="font-medium">Cuenta incorrecta</p>
              <p>
                Esta invitación es para <strong>{info.email}</strong>. Cierra sesión e inicia con
                esa cuenta.
              </p>
            </div>
          ) : (
            <Button className="w-full" onClick={aceptar} disabled={aceptando}>
              {aceptando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aceptando...
                </>
              ) : (
                'Aceptar invitación'
              )}
            </Button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400 justify-center">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Expira el{' '}
              {new Date(info.expiresAt).toLocaleDateString('es-DO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function InvitacionPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Building2 className="h-7 w-7 text-slate-800" />
            <span className="text-2xl font-bold text-slate-900">Órbita</span>
          </div>
        </div>
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            </div>
          }
        >
          <InvitacionContent />
        </Suspense>
      </div>
    </div>
  );
}
