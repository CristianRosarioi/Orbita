interface RolBadgeProps {
  rol: string;
  className?: string;
}

const ROL_CONFIG: Record<string, { label: string; className: string }> = {
  OWNER:    { label: 'Propietario',   className: 'bg-slate-900 text-white' },
  ADMIN:    { label: 'Administrador', className: 'bg-blue-700 text-white' },
  VENDEDOR: { label: 'Vendedor',      className: 'bg-green-600 text-white' },
  CONTADOR: { label: 'Contador',      className: 'bg-purple-600 text-white' },
  CAJERO:   { label: 'Cajero',        className: 'bg-orange-500 text-white' },
  VIEWER:   { label: 'Solo lectura',  className: 'bg-slate-400 text-white' },
};

export function RolBadge({ rol, className = '' }: RolBadgeProps) {
  const config = ROL_CONFIG[rol] ?? { label: rol, className: 'bg-slate-200 text-slate-700' };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
