'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RolBadge } from '@/components/shared/rol-badge';
import {
  Users,
  Mail,
  Trash2,
  Copy,
  Check,
  Crown,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const ROLES_INVITABLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'VENDEDOR', label: 'Vendedor' },
  { value: 'CONTADOR', label: 'Contador' },
  { value: 'CAJERO', label: 'Cajero' },
  { value: 'VIEWER', label: 'Solo lectura' },
] as const;

interface Miembro {
  id: string;
  rol: string;
  activo: boolean;
  usuario: {
    id: string;
    email: string;
    nombre: string | null;
    apellido: string | null;
    avatar: string | null;
    clerkId: string;
  };
}

interface Invitacion {
  id: string;
  email: string;
  rol: string;
  expiresAt: string;
  token: string;
}

interface Mensaje {
  tipo: 'ok' | 'error';
  texto: string;
}

function iniciales(m: Miembro) {
  const n = m.usuario.nombre?.[0] ?? '';
  const a = m.usuario.apellido?.[0] ?? '';
  return (n + a).toUpperCase() || (m.usuario.email[0]?.toUpperCase() ?? '?');
}

function nombreCompleto(m: Miembro) {
  const n = [m.usuario.nombre, m.usuario.apellido].filter(Boolean).join(' ');
  return n || m.usuario.email;
}

export default function UsuariosPage() {
  const { user } = useUser();
  const clerkId = user?.id;

  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  // Form invitación
  const [emailInv, setEmailInv] = useState('');
  const [rolInv, setRolInv] = useState<string>('VENDEDOR');
  const [invitando, setInvitando] = useState(false);
  const [linkGenerado, setLinkGenerado] = useState<string | null>(null);

  // Copiar
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/usuarios').then((r) => r.json()),
      fetch('/api/invitaciones').then((r) => r.json()),
    ])
      .then(([u, i]) => {
        if (!cancelled) {
          if (u.success) setMiembros(u.data);
          if (i.success) setInvitaciones(i.data);
          setCargando(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCargando(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const miRol = clerkId ? (miembros.find((m) => m.usuario.clerkId === clerkId)?.rol ?? null) : null;
  const esOwnerOAdmin = miRol === 'OWNER' || miRol === 'ADMIN';
  const esOwner = miRol === 'OWNER';

  function mostrarMensaje(tipo: 'ok' | 'error', texto: string) {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  }

  async function cambiarRol(miembroId: string, nuevoRol: string) {
    const res = await fetch(`/api/usuarios/${miembroId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: nuevoRol }),
    });
    const d = await res.json();
    if (d.success) {
      setMiembros((prev) => prev.map((m) => (m.id === miembroId ? { ...m, rol: nuevoRol } : m)));
      mostrarMensaje('ok', 'Rol actualizado correctamente.');
    } else {
      mostrarMensaje('error', d.error?.message ?? 'Error al cambiar el rol.');
    }
  }

  async function removerMiembro(miembroId: string, nombre: string) {
    if (!confirm(`¿Remover a ${nombre} de la empresa?`)) return;
    const res = await fetch(`/api/usuarios/${miembroId}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) {
      setMiembros((prev) => prev.filter((m) => m.id !== miembroId));
      mostrarMensaje('ok', 'Usuario removido correctamente.');
    } else {
      mostrarMensaje('error', d.error?.message ?? 'Error al remover el usuario.');
    }
  }

  async function cancelarInvitacion(invId: string) {
    const res = await fetch(`/api/invitaciones/${invId}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) {
      setInvitaciones((prev) => prev.filter((i) => i.id !== invId));
      mostrarMensaje('ok', 'Invitación cancelada.');
    } else {
      mostrarMensaje('error', d.error?.message ?? 'Error al cancelar la invitación.');
    }
  }

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    setInvitando(true);
    setLinkGenerado(null);
    try {
      const res = await fetch('/api/invitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInv, rol: rolInv }),
      });
      const d = await res.json();
      if (d.success) {
        setLinkGenerado(d.data.link);
        setEmailInv('');
        setInvitaciones((prev) => [d.data.invitacion, ...prev]);
        mostrarMensaje('ok', 'Invitación creada. Comparte el link con el usuario.');
      } else {
        mostrarMensaje('error', d.error?.message ?? 'Error al crear la invitación.');
      }
    } catch {
      mostrarMensaje('error', 'No se pudo conectar con el servidor.');
    } finally {
      setInvitando(false);
    }
  }

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(id);
      setTimeout(() => setCopiado(null), 2000);
    });
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

  if (cargando) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-slate-700" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Usuarios</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestiona los miembros de tu empresa</p>
        </div>
      </div>

      {mensaje && (
        <div
          className={`rounded-lg border px-4 py-3 flex items-center gap-3 text-sm ${
            mensaje.tipo === 'ok'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {mensaje.tipo === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {mensaje.texto}
        </div>
      )}

      {/* SECCIÓN 1 — Miembros actuales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Miembros ({miembros.filter((m) => m.activo).length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {miembros
              .filter((m) => m.activo)
              .map((m) => {
                const esYo = m.usuario.clerkId === clerkId;
                const esOwnerMiembro = m.rol === 'OWNER';
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    {/* Avatar iniciales */}
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                      {iniciales(m)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {nombreCompleto(m)}
                        </p>
                        {esOwnerMiembro && (
                          <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                        {esYo && (
                          <Badge variant="secondary" className="text-xs">
                            Tú
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{m.usuario.email}</p>
                    </div>
                    {/* Rol */}
                    <div className="flex items-center gap-2 shrink-0">
                      {esOwnerOAdmin && !esOwnerMiembro && !esYo ? (
                        <select
                          value={m.rol}
                          onChange={(e) => cambiarRol(m.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
                        >
                          {ROLES_INVITABLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <RolBadge rol={m.rol} />
                      )}
                      {esOwner && !esOwnerMiembro && !esYo && (
                        <button
                          onClick={() => removerMiembro(m.id, nombreCompleto(m))}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          title="Remover usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN 2 — Invitaciones pendientes */}
      {esOwnerOAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Invitaciones pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {invitaciones.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">
                No hay invitaciones pendientes.
              </p>
            ) : (
              <div className="space-y-2">
                {invitaciones.map((inv) => {
                  const link = `${baseUrl}/invitacion?token=${inv.token}`;
                  const yaCopiado = copiado === inv.id;
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{inv.email}</p>
                        <p className="text-xs text-slate-400">
                          <RolBadge rol={inv.rol} className="mr-1" />
                          Expira {new Date(inv.expiresAt).toLocaleDateString('es-DO')}
                        </p>
                      </div>
                      <button
                        onClick={() => copiar(link, inv.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                        title="Copiar link"
                      >
                        {yaCopiado ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {yaCopiado ? 'Copiado' : 'Copiar link'}
                      </button>
                      <button
                        onClick={() => cancelarInvitacion(inv.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                        title="Cancelar invitación"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECCIÓN 3 — Invitar nuevo usuario */}
      {esOwnerOAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Invitar nuevo usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500">
              El usuario recibirá un link para unirse. Compártelo por WhatsApp o email.
            </p>
            <form onSubmit={invitar} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="emailInv">Email</Label>
                  <Input
                    id="emailInv"
                    type="email"
                    value={emailInv}
                    onChange={(e) => setEmailInv(e.target.value)}
                    required
                    placeholder="empleado@empresa.com"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="rolInv">Rol</Label>
                  <select
                    id="rolInv"
                    value={rolInv}
                    onChange={(e) => setRolInv(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {ROLES_INVITABLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={invitando} className="w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                {invitando ? 'Creando invitación...' : 'Crear invitación'}
              </Button>
            </form>

            {linkGenerado && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                <p className="text-sm font-medium text-green-800">
                  Link generado — cópialo y compártelo
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white border border-green-200 rounded px-2 py-1.5 text-green-700 truncate">
                    {linkGenerado}
                  </code>
                  <button
                    onClick={() => copiar(linkGenerado, 'nuevo')}
                    className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 shrink-0 font-medium"
                  >
                    {copiado === 'nuevo' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiado === 'nuevo' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
