import Link from 'next/link';

const VERTICALES_LINKS = [
  { href: '/vertical/restaurante', label: 'Restaurante / Bar' },
  { href: '/vertical/colmado', label: 'Colmado / Minimarket' },
  { href: '/vertical/carwash', label: 'Carwash' },
  { href: '/vertical/repuestos', label: 'Repuestos de Vehículos' },
  { href: '/vertical/taller', label: 'Taller Mecánico' },
  { href: '/vertical/ferreteria', label: 'Ferretería' },
  { href: '/vertical/salon', label: 'Salón / Barbería' },
  { href: '/vertical/clinica', label: 'Clínica / Consultorio' },
  { href: '/vertical/inmobiliaria', label: 'Inmobiliaria' },
  { href: '/vertical/farmacia', label: 'Farmacia' },
  { href: '/vertical/tienda_ropa', label: 'Tienda de Ropa' },
  { href: '/vertical/tienda_online', label: 'Tienda Online / DMs' },
  { href: '/vertical/joyeria', label: 'Joyería' },
  { href: '/vertical/supermercado', label: 'Supermercado' },
];

const PRODUCTO_LINKS = [
  { href: '/#caracteristicas', label: 'Características' },
  { href: '/#verticales', label: 'Verticales' },
  { href: '/#precios', label: 'Precios' },
  { href: '/#faq', label: 'Preguntas frecuentes' },
];

const LEGAL_LINKS = [
  { href: '/terminos', label: 'Términos de uso' },
  { href: '/privacidad', label: 'Política de privacidad' },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-white"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">Órbita</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed">
              El sistema de gestión hecho para negocios de la República Dominicana.
            </p>
            <p className="text-xs text-slate-500">
              Desarrollado por{' '}
              <a
                href="https://orbitard.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-white"
              >
                OrbitaRD.com
              </a>
            </p>
          </div>

          {/* Producto */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Producto</h3>
            <ul className="space-y-2.5">
              {PRODUCTO_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a href={href} className="text-sm transition-colors hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Verticales */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Verticales</h3>
            <ul className="space-y-2">
              {VERTICALES_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto y Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Contacto</h3>
            <ul className="mb-6 space-y-2.5">
              <li>
                <a
                  href="mailto:contacto.orbitard@gmail.com"
                  className="text-sm transition-colors hover:text-white"
                >
                  contacto.orbitard@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/18298179643"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/orbita_rd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors hover:text-white"
                >
                  Instagram: @orbita_rd
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/OrbitaRD/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors hover:text-white"
                >
                  Facebook: OrbitaRD
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@orbita.rd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors hover:text-white"
                >
                  TikTok: @orbita.rd
                </a>
              </li>
            </ul>

            <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm">
          © 2026 Órbita RD. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
