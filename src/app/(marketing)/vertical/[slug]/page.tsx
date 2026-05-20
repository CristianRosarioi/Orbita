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
    description: v.descripcionLarga,
  };
}

export function generateStaticParams() {
  return Object.keys(VERTICALES).map((slug) => ({ slug }));
}

export default async function VerticalPage({ params }: Params) {
  const { slug } = await params;
  const v = VERTICALES[slug as VerticalSlug];
  if (!v) notFound();

  return (
    <div>
      {/* Hero de la vertical */}
      <section className={`${v.color.bg} border-b border-slate-200 py-16 md:py-24`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5">
              <Link href="/#verticales" className="text-sm text-slate-500 hover:text-slate-700">
                ← Todos los verticales
              </Link>
            </div>

            <div className="mb-6 text-6xl">{v.emoji}</div>

            <h1 className={`mb-4 text-4xl font-extrabold text-slate-900 sm:text-5xl`}>
              Órbita para{' '}
              <span className={v.color.text}>{v.nombre}</span>
            </h1>

            <p className="mb-4 text-lg font-medium text-slate-700">{v.tagline}</p>
            <p className="mb-8 text-base leading-relaxed text-slate-600">{v.descripcionLarga}</p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700"
              >
                Empezar gratis — 14 días
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/#precios"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Ver precios →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Funciones detalladas */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-slate-900">
              Todo lo que incluye el módulo
            </h2>
            <p className="text-slate-600">Funciones diseñadas para la operación diaria de tu negocio</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {v.funccionesDetalladas.map(({ titulo, desc }, i) => (
              <div
                key={titulo}
                className="rounded-2xl border border-slate-200 p-6 transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold ${v.color.badge}`}
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-slate-900">{titulo}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{desc}</p>

                {/* Decorative mockup bar */}
                <div className="mt-4 overflow-hidden rounded-lg bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 w-full rounded bg-slate-200" />
                    <div className="h-2 w-4/5 rounded bg-slate-200" />
                    <div className="h-2 w-3/5 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ¿Para quién es? */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
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

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Ejemplos del día a día:</h3>
              {v.ejemplos.map((ejemplo) => (
                <div
                  key={ejemplo}
                  className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                    <svg className="h-3 w-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-700">{ejemplo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA de la vertical */}
      <section className="bg-indigo-700 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mb-4 text-4xl">{v.emoji}</div>
          <h2 className="mb-4 text-2xl font-extrabold text-white sm:text-3xl">
            {v.ctaLabel}
          </h2>
          <p className="mb-8 text-indigo-200">
            Configura tu {v.nombre.toLowerCase()} en Órbita en menos de 5 minutos. 14 días gratis.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-indigo-700 transition-all hover:bg-indigo-50"
            >
              Crear cuenta gratis
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/"
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
