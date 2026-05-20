import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { VERTICALES_LIST } from './_data/verticales';
import { FAQSection } from './_components/faq';

export const metadata = {
  title: 'Órbita — Sistema de Gestión para Negocios Dominicanos',
  description:
    'Facturación DGII, nómina con TSS/ISR, módulos por industria. Todo lo que tu negocio necesita en un solo lugar.',
};

// ─── Dashboard Mockup ────────────────────────────────────────
function DashboardMockup() {
  const bars = [40, 65, 55, 80, 45, 90, 70, 85, 60, 95, 75, 88];
  const navItems = [
    { active: true, label: 'Inicio', w: 'w-10' },
    { active: false, label: 'Facturas', w: 'w-12' },
    { active: false, label: 'Clientes', w: 'w-11' },
    { active: false, label: 'Productos', w: 'w-14' },
    { active: false, label: 'Reportes', w: 'w-12' },
    { active: false, label: 'Nómina', w: 'w-10' },
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
          <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-white px-3 py-1 ring-1 ring-slate-200">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-slate-400">app.orbitard.com/dashboard</span>
          </div>
        </div>

        <div className="flex h-72">
          {/* Sidebar */}
          <div className="flex w-36 shrink-0 flex-col gap-1 bg-slate-900 p-3">
            <div className="mb-2 flex items-center gap-1.5 px-2 py-1">
              <div className="h-5 w-5 rounded bg-indigo-600" />
              <div className="h-2.5 w-10 rounded bg-slate-600" />
            </div>
            {navItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-1.5 rounded px-2 py-1.5 ${item.active ? 'bg-indigo-600' : ''}`}
              >
                <div
                  className={`h-3 w-3 rounded-sm ${item.active ? 'bg-indigo-300' : 'bg-slate-700'}`}
                />
                <div
                  className={`h-2 rounded ${item.active ? `${item.w} bg-indigo-300` : `${item.w} bg-slate-700`}`}
                />
              </div>
            ))}
          </div>

          {/* Main area */}
          <div className="flex flex-1 flex-col gap-3 bg-slate-50 p-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 h-3 w-28 rounded bg-slate-300" />
                <div className="h-2 w-20 rounded bg-slate-200" />
              </div>
              <div className="h-7 w-24 rounded-lg bg-indigo-600" />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'RD$45,230', label: 'Ventas hoy', up: true },
                { val: '23', label: 'Facturas', up: false },
                { val: '148', label: 'Clientes', up: false },
              ].map(({ val, label, up }) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <div className="mb-1 h-2 w-12 rounded bg-slate-200" />
                  <div className="text-sm font-bold text-slate-800">{val}</div>
                  {up && (
                    <div className="mt-0.5 flex items-center gap-0.5">
                      <div className="h-1.5 w-1.5 rounded-sm bg-green-500" />
                      <div className="h-1.5 w-6 rounded bg-green-200" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="mb-2 h-2 w-16 rounded bg-slate-200" />
              <div className="flex items-end gap-0.5" style={{ height: '56px' }}>
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-indigo-500"
                    style={{ height: `${h}%`, opacity: 0.7 + i * 0.025 }}
                  />
                ))}
              </div>
            </div>

            {/* Transactions */}
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="mb-2 h-2 w-24 rounded bg-slate-200" />
              <div className="space-y-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-indigo-100" />
                    <div className="h-2 flex-1 rounded bg-slate-100" />
                    <div className="h-2 w-14 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-indigo-50 opacity-60 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-purple-50 opacity-40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — text */}
          <div>
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5">
              <span className="text-base">🇩🇴</span>
              <span className="text-sm font-medium text-indigo-700">
                Hecho para la República Dominicana
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl xl:text-6xl">
              El sistema de gestión hecho para{' '}
              <span className="text-indigo-600">negocios dominicanos</span>
            </h1>

            <p className="mb-8 text-lg leading-relaxed text-slate-600 sm:text-xl">
              Facturación DGII, nómina con TSS/ISR, módulos por industria y todo lo que tu negocio
              necesita. Sin complicaciones.
            </p>

            {/* CTAs */}
            <div className="mb-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30"
              >
                Empieza gratis 14 días
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                Ver demo
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { value: '+500', label: 'negocios activos' },
                { value: '606/607', label: 'automático' },
                { value: 'TSS+ISR', label: 'calculado solo' },
                { value: '6', label: 'verticales' },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-center">
                  <div className="text-lg font-bold text-slate-900">{value}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — mockup */}
          <div className="hidden lg:block">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Problemas → Soluciones ───────────────────────────────────
function ProblemasSection() {
  const items = [
    {
      problema: 'Hacer el 606 manualmente en Excel',
      solucion: 'Órbita lo genera en un click, listo para subir a la DGII',
      emoji: '📊',
    },
    {
      problema: 'Calcular TSS e ISR a mano cada quincena',
      solucion: 'La nómina se calcula sola. Solo confirmas y generas los recibos',
      emoji: '💸',
    },
    {
      problema: 'Un sistema diferente para cada área del negocio',
      solucion: 'Facturación, inventario, nómina y reportes en un solo lugar',
      emoji: '🔗',
    },
  ];

  return (
    <section id="caracteristicas" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            ¿Cansado de estos problemas?
          </h2>
          <p className="text-lg text-slate-600">
            Órbita resuelve los dolores más comunes de los negocios dominicanos
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map(({ problema, solucion, emoji }) => (
            <div
              key={problema}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {/* Problem */}
              <div className="bg-red-50 px-6 py-5">
                <div className="mb-3 text-2xl">{emoji}</div>
                <p className="text-sm font-semibold text-red-700 line-through opacity-75">
                  {problema}
                </p>
              </div>
              {/* Solution */}
              <div className="px-6 py-5">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{solucion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Verticales ───────────────────────────────────────────────
function VerticalesSection() {
  return (
    <section id="verticales" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Un sistema adaptado a tu industria
          </h2>
          <p className="text-lg text-slate-600">
            Órbita detecta tu tipo de negocio y activa los módulos que necesitas
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VERTICALES_LIST.map((v) => (
            <div
              key={v.slug}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="text-3xl">{v.emoji}</span>
                <h3 className="font-bold text-slate-900">{v.nombre}</h3>
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {v.funciones.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={`/vertical/${v.slug}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
              >
                Ver más
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Módulos Transversales ───────────────────────────────────
function ModulosSection() {
  const modulos = [
    {
      emoji: '📄',
      titulo: 'Facturación DGII',
      desc: 'Emite facturas con NCF, genera reportes 606, 607 y 608 listos para la DGII.',
    },
    {
      emoji: '👥',
      titulo: 'Gestión de Clientes',
      desc: 'Historial completo, crédito, estado de cuentas y contacto directo desde el sistema.',
    },
    {
      emoji: '📦',
      titulo: 'Inventario Automático',
      desc: 'El stock se actualiza solo con cada venta, compra o transferencia entre sucursales.',
    },
    {
      emoji: '🏧',
      titulo: 'Punto de Venta (POS)',
      desc: 'Vende rápido con búsqueda instantánea, cobro en efectivo y tarjeta, tickets impresos.',
    },
    {
      emoji: '👔',
      titulo: 'Nómina Dominicana',
      desc: 'Calcula TSS (SFS + AFP), ISR según tabla progresiva, y genera recibos de pago.',
    },
    {
      emoji: '📊',
      titulo: 'Contabilidad',
      desc: 'Libro diario, balance general, plan de cuentas y asientos automáticos.',
    },
    {
      emoji: '🏢',
      titulo: 'Multi-Sucursal',
      desc: 'Maneja varias ubicaciones con inventario independiente y transferencias entre sucursales.',
    },
    {
      emoji: '🛒',
      titulo: 'Módulo de Compras',
      desc: 'Órdenes de compra a proveedores, registro de gastos y reporte 607 con NCF.',
    },
  ];

  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Todo lo que necesita cualquier negocio
          </h2>
          <p className="text-lg text-slate-600">
            Módulos que funcionan juntos desde el primer día
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {modulos.map(({ emoji, titulo, desc }) => (
            <div
              key={titulo}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className="mb-3 text-3xl">{emoji}</div>
              <h3 className="mb-2 font-semibold text-slate-900">{titulo}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Precios ─────────────────────────────────────────────────
function PreciosSection() {
  const planes = [
    {
      nombre: 'Básico',
      precio: '1,500',
      descripcion: 'Para negocios pequeños que empiezan a ordenarse.',
      popular: false,
      incluye: [
        '1 usuario',
        '1 sucursal',
        'Facturación y POS',
        'Reportes DGII básicos',
        'Inventario automático',
      ],
      excluye: ['Nómina', 'Módulos de verticales', 'Multi-sucursal'],
      cta: 'Empezar gratis',
      ctaHref: '/sign-up',
      ctaStyle: 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
    },
    {
      nombre: 'Profesional',
      precio: '3,000',
      descripcion: 'Para negocios en crecimiento con equipos y múltiples necesidades.',
      popular: true,
      incluye: [
        'Hasta 5 usuarios',
        '2 sucursales',
        'Todo del plan Básico',
        'Nómina con TSS e ISR',
        '1 vertical activa',
        'Compras y gastos',
        'Soporte prioritario',
      ],
      excluye: [],
      cta: 'Empezar gratis',
      ctaHref: '/sign-up',
      ctaStyle: 'bg-indigo-600 text-white hover:bg-indigo-700',
    },
    {
      nombre: 'Empresarial',
      precio: '5,000',
      descripcion: 'Para empresas con operaciones complejas o múltiples sucursales.',
      popular: false,
      incluye: [
        'Usuarios ilimitados',
        'Sucursales ilimitadas',
        'Todo del plan Profesional',
        'Todas las verticales activas',
        'Reportes avanzados',
        'Contabilidad completa',
        'Soporte dedicado',
      ],
      excluye: [],
      cta: 'Contactar ventas',
      ctaHref: '/contacto',
      ctaStyle: 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
    },
  ];

  return (
    <section id="precios" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Precios transparentes, sin sorpresas
          </h2>
          <p className="text-lg text-slate-600">
            Planes en pesos dominicanos. Sin contrato anual obligatorio.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {planes.map(({ nombre, precio, descripcion, popular, incluye, excluye, cta, ctaHref, ctaStyle }) => (
            <div
              key={nombre}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all${popular ? ' border-indigo-600 shadow-xl shadow-indigo-600/10 ring-2 ring-indigo-600' : ' border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
            >
              {popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                    ⭐ Más popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-1 text-lg font-bold text-slate-900">{nombre}</h3>
                <p className="mb-4 text-sm text-slate-600">{descripcion}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-slate-500">RD$</span>
                  <span className="text-4xl font-extrabold text-slate-900">{precio}</span>
                  <span className="text-sm text-slate-500">/mes</span>
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-2.5">
                {incluye.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
                {excluye.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-400">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href={ctaHref}
                className={`block rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all ${ctaStyle}`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Todos los planes incluyen 14 días de prueba gratis. No se requiere tarjeta de crédito.
        </p>
      </div>
    </section>
  );
}

// ─── CTA Final ───────────────────────────────────────────────
function CTAFinalSection() {
  return (
    <section className="bg-indigo-700 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
          Empieza a ordenar tu negocio hoy
        </h2>
        <p className="mb-8 text-lg text-indigo-200">
          14 días gratis, sin tarjeta de crédito. Configura tu empresa en menos de 5 minutos.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50"
        >
          Crear cuenta gratis
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <p className="mt-4 text-sm text-indigo-300">
          Sin tarjeta de crédito · Cancela cuando quieras
        </p>
      </div>
    </section>
  );
}

// ─── Landing Page ────────────────────────────────────────────
export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return (
    <>
      <HeroSection />
      <ProblemasSection />
      <VerticalesSection />
      <ModulosSection />
      <PreciosSection />
      <FAQSection />
      <CTAFinalSection />
    </>
  );
}
