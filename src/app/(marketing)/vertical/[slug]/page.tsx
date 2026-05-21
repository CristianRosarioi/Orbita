import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { VERTICALES, type VerticalSlug } from '../../_data/verticales';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const v = VERTICALES[slug as VerticalSlug];
  if (!v) return { title: 'No encontrado' };
  return {
    title: `${v.nombre} — Órbita`,
    description: v.descripcionCorta,
  };
}

export function generateStaticParams() {
  return Object.keys(VERTICALES).map((slug) => ({ slug }));
}

const PLANES = [
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

export default async function VerticalPage({ params }: Params) {
  const { slug } = await params;
  const v = VERTICALES[slug as VerticalSlug];
  if (!v) notFound();

  return (
    <div>
      {/* ── SECCIÓN 1: Hero ─────────────────────────────── */}
      <section className={`${v.color.bg} border-b border-slate-200 py-16 md:py-24`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5">
              <span className="text-lg">{v.emoji}</span>
              <span className={`text-sm font-semibold ${v.color.text}`}>{v.nombre}</span>
            </div>

            <h1 className="mb-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
              Órbita para <span className={v.color.text}>{v.nombre}</span>
            </h1>

            <p className="mb-3 text-xl font-medium text-slate-700">{v.tagline}</p>
            <p className="mb-8 text-base leading-relaxed text-slate-600">{v.descripcionCorta}</p>

            <div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700"
              >
                Crear cuenta gratis — 15 días
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <a
                href="#precios"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Ver precios →
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                15 días gratis
              </span>
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Sin tarjeta de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Cancela cuando quieras
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: Funciones detalladas ─────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-slate-900">
              Todo lo que incluye el módulo
            </h2>
            <p className="text-slate-600">
              Funciones diseñadas para la operación diaria de tu negocio
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {v.funccionesDetalladas.map(({ titulo, desc }, i) => (
              <div
                key={titulo}
                className="rounded-2xl border border-slate-200 p-6 transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${v.color.badge}`}
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-slate-900">{titulo}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: ¿Para quién es? ──────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-slate-900">¿Para quién es?</h2>
              <p className="mb-6 text-slate-600">
                Este módulo está diseñado para negocios como estos:
              </p>
              <div className="flex flex-wrap gap-2">
                {v.paraQuien.map((tipo) => (
                  <span
                    key={tipo}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium ${v.color.badge}`}
                  >
                    {tipo}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-slate-900">Ejemplos del día a día:</h3>
              <div className="space-y-3">
                {v.ejemplos.map((ejemplo) => (
                  <div
                    key={ejemplo}
                    className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                      <svg
                        className="h-3 w-3 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-700">{ejemplo}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: Precios ──────────────────────────── */}
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
            {PLANES.map(
              ({
                nombre,
                precio,
                descripcion,
                popular,
                incluye,
                excluye,
                cta,
                ctaHref,
                ctaStyle,
              }) => (
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
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {item}
                      </li>
                    ))}
                    {excluye.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-400">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
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
              ),
            )}
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            Todos los planes incluyen 15 días de prueba gratis. No se requiere tarjeta de crédito.
          </p>
        </div>
      </section>

      {/* ── SECCIÓN 5: CTA final ────────────────────────── */}
      <section className="bg-indigo-700 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mb-4 text-4xl">{v.emoji}</div>
          <h2 className="mb-4 text-2xl font-extrabold text-white sm:text-3xl">{v.ctaLabel}</h2>
          <p className="mb-8 text-indigo-200">
            Configura tu {v.nombre} en Órbita en menos de 5 minutos. 15 días gratis.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-indigo-700 transition-all hover:bg-indigo-50"
            >
              Crear cuenta gratis
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/#verticales"
              className="text-sm font-medium text-indigo-200 hover:text-white"
            >
              ← Ver todos los módulos
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
