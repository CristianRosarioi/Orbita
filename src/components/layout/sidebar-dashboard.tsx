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
  Truck,
  ShoppingCart,
  DollarSign,
  ClipboardList,
  BookOpen,
  Scale,
  BookMarked,
  FileDown,
} from 'lucide-react';
import type { RolEmpresa } from '@/types/enums';

interface SidebarProps {
  empresa: {
    id: string;
    nombre: string;
    nombreComercial: string | null;
    estadoSusc: string;
    trialFinaliza: Date | null;
  };
  sucursal: { id: string; nombre: string } | null;
  rol: RolEmpresa | string;
  usuario: { nombre: string | null; apellido: string | null };
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/proveedores', label: 'Proveedores', icon: Truck },
  { href: '/facturas', label: 'Facturas', icon: FileText },
];

const CONTABILIDAD_ITEMS = [
  { href: '/contabilidad', label: 'Balance general', icon: Scale },
  { href: '/contabilidad/cuentas', label: 'Plan de cuentas', icon: BookMarked },
  { href: '/contabilidad/asientos', label: 'Libro diario', icon: BookOpen },
];

const REPORTES_ITEMS = [
  { href: '/reportes', label: 'Centro de reportes', icon: BarChart2 },
  { href: '/reportes/606', label: 'Reporte 606', icon: FileDown },
  { href: '/reportes/607', label: 'Reporte 607', icon: FileDown },
  { href: '/reportes/608', label: 'Reporte 608', icon: FileDown },
];

const ROLES_CAJA = ['OWNER', 'ADMIN', 'CAJERO'];

const CONFIG_ITEMS = [
  { href: '/configuracion/empresa', label: 'Mi empresa' },
  { href: '/configuracion/usuarios', label: 'Usuarios' },
  { href: '/configuracion/categorias', label: 'Categorías' },
  { href: '/configuracion/unidades-medida', label: 'Unidades de medida' },
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
            {sucursal && <p className="text-xs text-slate-400 truncate">{sucursal.nombre}</p>}
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0 ml-auto" />
        </div>
        <p className="text-xs text-slate-500 mt-2">{ROL_LABELS[rol] ?? rol}</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {/* Inicio */}
        {(() => {
          const { href, label, icon: Icon } = NAV_ITEMS[0]!;
          const activo = pathname === href;
          return (
            <Link
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
        })()}

        {/* POS con sub-links */}
        <div>
          <Link
            href="/pos"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith('/pos')
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            POS
          </Link>
          {ROLES_CAJA.includes(rol) && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
              <Link
                href="/pos/abrir-caja"
                className={`flex items-center gap-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === '/pos/abrir-caja'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <DollarSign className="h-3 w-3 shrink-0" />
                Abrir caja
              </Link>
              <Link
                href="/pos/historial"
                className={`flex items-center gap-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === '/pos/historial'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <ClipboardList className="h-3 w-3 shrink-0" />
                Historial de caja
              </Link>
            </div>
          )}
        </div>

        {/* Resto de nav items */}
        {NAV_ITEMS.slice(1).map(({ href, label, icon: Icon }) => {
          const activo = pathname.startsWith(href);
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

        {/* Contabilidad con sub-links */}
        <div>
          <p className="px-3 pt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Contabilidad
          </p>
          {CONTABILIDAD_ITEMS.map(({ href, label, icon: Icon }) => {
            const activo =
              href === '/contabilidad' ? pathname === '/contabilidad' : pathname.startsWith(href);
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
        </div>

        {/* Reportes DGII con sub-links */}
        <div>
          <p className="px-3 pt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Reportes DGII
          </p>
          {REPORTES_ITEMS.map(({ href, label, icon: Icon }) => {
            const activo =
              href === '/reportes' ? pathname === '/reportes' : pathname.startsWith(href);
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
        </div>

        {/* Configuración */}
        <div className="pt-3">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Configuración
          </p>
          {CONFIG_ITEMS.map(({ href, label }) => {
            const activo = pathname.startsWith(href);
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
                <Settings className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
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
            {[usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || 'Usuario'}
          </p>
          <p className="text-xs text-slate-400">{ROL_LABELS[rol] ?? rol}</p>
        </div>
      </div>
    </aside>
  );
}
