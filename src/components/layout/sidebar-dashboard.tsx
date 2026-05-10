'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  Building2,
  LayoutDashboard,
  Users,
  Package,
  FileText,
  BarChart2,
  Settings,
  ChevronRight,
} from 'lucide-react';
import type { RolEmpresa } from '@/types/enums';

interface SidebarProps {
  empresa: { id: string; nombre: string; nombreComercial: string | null; estadoSusc: string; trialFinaliza: Date | null };
  sucursal: { id: string; nombre: string } | null;
  rol: RolEmpresa | string;
  usuario: { nombre: string | null; apellido: string | null };
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/facturas', label: 'Facturas', icon: FileText },
  { href: '/reportes', label: 'Reportes', icon: BarChart2 },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

const ROL_LABELS: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  CONTADOR: 'Contador',
  CAJERO: 'Cajero',
  VIEWER: 'Solo lectura',
};

export function SidebarDashboard({ empresa, sucursal, rol, usuario }: SidebarProps) {
  const pathname = usePathname();
  const nombreEmpresa = empresa.nombreComercial ?? empresa.nombre;

  return (
    <aside className="w-60 flex flex-col bg-slate-900 text-white shrink-0">
      {/* Cabecera — empresa activa */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-slate-700 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-slate-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{nombreEmpresa}</p>
            {sucursal && (
              <p className="text-xs text-slate-400 truncate">{sucursal.nombre}</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0 ml-auto" />
        </div>
        <p className="text-xs text-slate-500 mt-2">{ROL_LABELS[rol] ?? rol}</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const activo = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activo
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — usuario y avatar Clerk */}
      <div className="p-4 border-t border-slate-700 flex items-center gap-3">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">
            {usuario.nombre ?? ''} {usuario.apellido ?? ''}
          </p>
        </div>
      </div>
    </aside>
  );
}
