'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

const SEGMENTO_LABEL: Record<string, string> = {
  dashboard: 'Inicio',
  clientes: 'Clientes',
  nuevo: 'Nuevo',
  nueva: 'Nueva',
  editar: 'Editar',
  productos: 'Productos',
  proveedores: 'Proveedores',
  facturas: 'Facturas',
  pos: 'POS',
  contabilidad: 'Contabilidad',
  cuentas: 'Plan de cuentas',
  asientos: 'Libro diario',
  reportes: 'Reportes',
  '606': 'Reporte 606',
  '607': 'Reporte 607',
  '608': 'Reporte 608',
  configuracion: 'Configuración',
  empresa: 'Mi empresa',
  usuarios: 'Usuarios',
  categorias: 'Categorías',
  'unidades-medida': 'Unidades de medida',
  'abrir-caja': 'Abrir caja',
  historial: 'Historial de caja',
  cierre: 'Cierre',
  invitacion: 'Invitación',
};

function esId(seg: string) {
  return (seg.startsWith('c') && seg.length > 15) || seg.match(/^[a-z0-9]{15,}$/i) !== null;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const segmentos = pathname.split('/').filter(Boolean);

  // Construir breadcrumb omitiendo IDs dinámicos
  type Crumb = { label: string; href: string };
  const crumbs: Crumb[] = [];
  let ruta = '';
  for (const seg of segmentos) {
    ruta += `/${seg}`;
    if (esId(seg)) continue;
    const label = SEGMENTO_LABEL[seg] ?? seg;
    crumbs.push({ label, href: ruta });
  }

  const paginaActual = crumbs[crumbs.length - 1]?.label ?? 'Dashboard';
  const anteriores = crumbs.slice(0, -1);

  return (
    <header className="h-16 w-full shrink-0 bg-white border-b border-slate-200 shadow-sm flex items-center px-4 md:px-6 gap-3 z-10">
      {/* Espacio para hamburguesa móvil */}
      <div className="w-10 md:hidden" />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-lg leading-tight tracking-tight truncate">
          {paginaActual}
        </p>
        {anteriores.length > 0 && (
          <nav className="flex items-center gap-1 text-xs mt-0.5 min-w-0">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              <Home className="h-3 w-3" />
            </Link>
            {anteriores.map((c) => (
              <span key={c.href} className="flex items-center gap-1 text-slate-400 shrink-0">
                <ChevronRight className="h-3 w-3" />
                <Link
                  href={c.href}
                  className="hover:text-slate-600 transition-colors truncate max-w-28"
                >
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
