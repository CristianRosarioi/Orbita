'use client';

import { useState } from 'react';
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
  Menu,
  X,
  LayoutGrid,
  ChefHat,
  CreditCard,
  Tag,
  ShoppingBag,
  Receipt,
  UserCheck,
  Wallet,
  Wrench,
  Car,
  CalendarDays,
  Clock,
  AlertTriangle,
  Ruler,
  ArrowRightLeft,
  UserRound,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RolEmpresa } from '@/types/enums';

interface SidebarProps {
  empresa: {
    id: string;
    nombre: string;
    nombreComercial: string | null;
    industria: string;
    estadoSusc: string;
    trialFinaliza: Date | null;
  };
  sucursal: { id: string; nombre: string } | null;
  rol: RolEmpresa | string;
  usuario: { nombre: string | null; apellido: string | null };
}

const INDUSTRIAS_RESTAURANTE = ['RESTAURANTE'];
const INDUSTRIAS_COLMADO = ['COLMADO', 'TIENDA_ONLINE', 'TIENDA_ROPA'];
const INDUSTRIAS_TALLER = ['TALLER_MECANICO', 'CARWASH', 'REPUESTOS'];
const INDUSTRIAS_SALON = ['SALON_BARBERIA'];
const INDUSTRIAS_FARMACIA = ['FARMACIA', 'BOTICA', 'DROGUERIA'];
const INDUSTRIAS_FERRETERIA = ['FERRETERIA', 'MATERIALES', 'PINTURAS'];
const INDUSTRIAS_CLINICA = ['CLINICA', 'DENTAL', 'VETERINARIA'];

const RESTAURANTE_ITEMS = [
  { href: '/restaurante/mesas', label: 'Mesas', icon: LayoutGrid },
  { href: '/restaurante/comandas', label: 'Comandas', icon: ClipboardList },
  { href: '/restaurante/cocina', label: 'Cocina', icon: ChefHat },
];

const COLMADO_ITEMS = [
  { href: '/colmado/fiado', label: 'Fiado', icon: CreditCard },
  { href: '/colmado/precios', label: 'Precios', icon: Tag },
];

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/proveedores', label: 'Proveedores', icon: Truck },
  { href: '/facturas', label: 'Facturas', icon: FileText },
];

const COMPRAS_ITEMS = [
  { href: '/compras/ordenes', label: 'Órdenes', icon: ShoppingBag },
  { href: '/compras/gastos', label: 'Gastos', icon: Receipt },
];

const NOMINA_ITEMS = [
  { href: '/nomina/empleados', label: 'Empleados', icon: UserCheck },
  { href: '/nomina/nominas', label: 'Nóminas', icon: Wallet },
];

const TALLER_ITEMS = [
  { href: '/taller/ordenes', label: 'Órdenes de trabajo', icon: Wrench },
  { href: '/taller/historial', label: 'Historial por placa', icon: Car },
];

const SALON_ITEMS = [
  { href: '/salon/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/salon/citas', label: 'Citas', icon: Clock },
];

const FARMACIA_ITEMS = [
  { href: '/farmacia/lotes', label: 'Control de lotes', icon: Package },
  { href: '/farmacia/vencimientos', label: 'Vencimientos', icon: AlertTriangle },
];

const FERRETERIA_ITEMS = [
  { href: '/ferreteria/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/ferreteria/unidades', label: 'Unidades', icon: Ruler },
];

const CLINICA_ITEMS = [
  { href: '/clinica/pacientes', label: 'Pacientes', icon: UserRound },
  { href: '/clinica/consultas', label: 'Consultas', icon: Stethoscope },
  { href: '/clinica/agenda', label: 'Agenda médica', icon: CalendarDays },
];

const INVENTARIO_ITEMS = [
  { href: '/transferencias', label: 'Transferencias', icon: ArrowRightLeft },
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
  { href: '/sucursales', label: 'Sucursales' },
];

const ROL_LABELS: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  CONTADOR: 'Contador',
  CAJERO: 'Cajero',
  VIEWER: 'Solo lectura',
};

// Tooltip para modo ícono (visible solo en md-xl)
function NavTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/navitem:opacity-100 xl:hidden md:block z-50">
      {label}
    </span>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  onClick?: () => void;
  sub?: boolean;
}

function NavLink({ href, label, icon: Icon, exact, onClick, sub }: NavLinkProps) {
  const pathname = usePathname();
  const activo = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      title={label}
      className={cn(
        'group/navitem relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        sub ? 'py-1.5 text-xs' : '',
        activo
          ? 'bg-indigo-600 text-white'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
      )}
    >
      <Icon className={cn('shrink-0', sub ? 'h-3 w-3' : 'h-4 w-4')} />
      <span className="hidden xl:inline">{label}</span>
      <NavTooltip label={label} />
    </Link>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1">
      <div className="hidden xl:flex items-center gap-2">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 h-px bg-slate-700/50" />
      </div>
      <div className="block xl:hidden border-t border-slate-700/50" />
    </div>
  );
}

function SidebarContent({
  empresa,
  sucursal,
  rol,
  usuario,
  onLinkClick,
}: SidebarProps & { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const nombreEmpresa = empresa.nombreComercial ?? empresa.nombre;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#020617', color: 'white' }}>
      {/* Cabecera empresa */}
      <div className="border-b border-slate-800 p-3 xl:p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-700">
            <Building2 className="h-4 w-4 text-slate-300" />
          </div>
          <div className="hidden min-w-0 xl:block">
            <p className="truncate text-sm font-semibold leading-tight">{nombreEmpresa}</p>
            {sucursal && <p className="truncate text-xs text-slate-400">{sucursal.nombre}</p>}
          </div>
          <ChevronRight className="ml-auto hidden h-4 w-4 shrink-0 text-slate-500 xl:block" />
        </div>
        <p className="mt-2 hidden text-xs text-slate-500 xl:block">{ROL_LABELS[rol] ?? rol}</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 xl:p-3">
        {/* Inicio */}
        <NavLink
          href="/dashboard"
          label="Inicio"
          icon={LayoutDashboard}
          exact
          onClick={onLinkClick}
        />

        {/* POS */}
        <div>
          <Link
            href="/pos"
            title="POS"
            onClick={onLinkClick}
            className={cn(
              'group/navitem relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/pos')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
            )}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            <span className="hidden xl:inline">POS</span>
            <NavTooltip label="POS" />
          </Link>
          {ROLES_CAJA.includes(rol) && (
            <div className="ml-3 mt-0.5 hidden space-y-0.5 border-l border-slate-700 pl-3 xl:block">
              <Link
                href="/pos/abrir-caja"
                onClick={onLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-md py-1.5 text-xs font-medium transition-colors',
                  pathname === '/pos/abrir-caja'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300',
                )}
              >
                <DollarSign className="h-3 w-3 shrink-0" />
                Abrir caja
              </Link>
              <Link
                href="/pos/historial"
                onClick={onLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-md py-1.5 text-xs font-medium transition-colors',
                  pathname === '/pos/historial'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300',
                )}
              >
                <ClipboardList className="h-3 w-3 shrink-0" />
                Historial de caja
              </Link>
            </div>
          )}
        </div>

        {/* Resto items principales */}
        {NAV_ITEMS.slice(1).map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} onClick={onLinkClick} />
        ))}

        {/* Vertical: Restaurante */}
        {INDUSTRIAS_RESTAURANTE.includes(empresa.industria) && (
          <>
            <SectionDivider label="Restaurante" />
            {RESTAURANTE_ITEMS.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} onClick={onLinkClick} />
            ))}
          </>
        )}

        {/* Vertical: Colmado / Tienda */}
        {INDUSTRIAS_COLMADO.includes(empresa.industria) && (
          <>
            <SectionDivider label="Mi Tienda" />
            {COLMADO_ITEMS.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} onClick={onLinkClick} />
            ))}
          </>
        )}

        {/* Vertical: Taller Mecánico */}
        {INDUSTRIAS_TALLER.includes(empresa.industria) && (
          <>
            <SectionDivider label="Taller" />
            {TALLER_ITEMS.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} onClick={onLinkClick} />
            ))}
          </>
        )}

        {/* Vertical: Salón de Belleza */}
        {INDUSTRIAS_SALON.includes(empresa.industria) && (
          <>
            <SectionDivider label="Salón" />
            {SALON_ITEMS.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} onClick={onLinkClick} />
            ))}
          </>
        )}

        {/* Vertical: Farmacia */}
        {INDUSTRIAS_FARMACIA.includes(empresa.industria) && (
          <>
            <SectionDivider label="Farmacia" />
            {FARMACIA_ITEMS.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} onClick={onLinkClick} />
            ))}
          </>
        )}

        {/* Vertical: Ferretería */}
        {INDUSTRIAS_FERRETERIA.includes(empresa.industria) && (
          <>
            <SectionDivider label="Ferretería" />
            {FERRETERIA_ITEMS.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} onClick={onLinkClick} />
            ))}
          </>
        )}

        {/* Vertical: Clínica / Consultorio */}
        {INDUSTRIAS_CLINICA.includes(empresa.industria) && (
          <>
            <SectionDivider label="Clínica" />
            {CLINICA_ITEMS.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} onClick={onLinkClick} />
            ))}
          </>
        )}

        {/* Compras */}
        <SectionDivider label="Compras" />
        {COMPRAS_ITEMS.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} onClick={onLinkClick} />
        ))}

        {/* Inventario */}
        <SectionDivider label="Inventario" />
        {INVENTARIO_ITEMS.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} onClick={onLinkClick} />
        ))}

        {/* Nómina */}
        <SectionDivider label="Nómina" />
        {NOMINA_ITEMS.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} onClick={onLinkClick} />
        ))}

        {/* Contabilidad */}
        <SectionDivider label="Contabilidad" />
        {CONTABILIDAD_ITEMS.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            exact={href === '/contabilidad'}
            onClick={onLinkClick}
          />
        ))}

        {/* Reportes DGII */}
        <SectionDivider label="Reportes DGII" />
        {REPORTES_ITEMS.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            exact={href === '/reportes'}
            onClick={onLinkClick}
          />
        ))}

        {/* Configuración */}
        <SectionDivider label="Configuración" />
        {CONFIG_ITEMS.map(({ href, label }) => (
          <NavLink key={href} href={href} label={label} icon={Settings} onClick={onLinkClick} />
        ))}
      </nav>

      {/* Footer usuario */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
          <div className="hidden min-w-0 flex-1 xl:block">
            <p className="truncate text-sm font-medium text-white">
              {[usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || 'Usuario'}
            </p>
            <p className="text-xs text-slate-500">{ROL_LABELS[rol] ?? rol}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarDashboard(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Botón hamburguesa — solo visible en móvil */}
      <button
        className="fixed left-4 top-4 z-50 flex items-center justify-center rounded-lg p-2 text-white shadow-lg md:hidden"
        style={{ backgroundColor: '#020617' }}
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay oscuro — móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar móvil — slide-in */}
      {mobileOpen && (
        <aside
          className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col text-white md:hidden"
          style={{ backgroundColor: '#020617' }}
        >
          <button
            className="absolute right-3 top-3 p-1 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent {...props} onLinkClick={() => setMobileOpen(false)} />
        </aside>
      )}

      {/* Sidebar desktop — responsivo con CSS */}
      {/* md: w-14 (solo íconos), xl: w-56 (íconos + texto) */}
      <aside
        className="sticky top-0 hidden h-screen w-14 shrink-0 flex-col text-white md:flex xl:w-60"
        style={{ backgroundColor: '#020617' }}
      >
        <SidebarContent {...props} />
      </aside>
    </>
  );
}
