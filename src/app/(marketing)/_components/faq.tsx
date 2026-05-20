'use client';

import { useState } from 'react';

const FAQS = [
  {
    pregunta: '¿Órbita cumple con los requisitos de la DGII?',
    respuesta:
      'Sí. Órbita genera los reportes 606 (ventas), 607 (compras) y 608 (anulaciones) en el formato exacto que requiere la DGII. También soporta NCF para cuando operes en modo fiscal completo.',
  },
  {
    pregunta: '¿Cómo funciona el cálculo de nómina?',
    respuesta:
      'Órbita calcula automáticamente el TSS (SFS 3.04% + AFP 2.87% empleado, y 15.39% patronal) y el ISR según la tabla progresiva vigente 2026 de la DGII. Solo introduces el salario y el sistema hace todo lo demás.',
  },
  {
    pregunta: '¿Puedo usar Órbita en mi restaurante y mi tienda?',
    respuesta:
      'Sí. Cada empresa en Órbita tiene su industria configurada y el sistema activa los módulos correctos automáticamente. Puedes tener múltiples empresas en una sola cuenta.',
  },
  {
    pregunta: '¿Qué pasa con mis datos si cancelo?',
    respuesta:
      'Puedes exportar toda tu información en cualquier momento antes de cancelar. Tus datos no desaparecen de forma inmediata — tienes un período de gracia para descargar todo.',
  },
  {
    pregunta: '¿Funciona sin internet?',
    respuesta:
      'La versión web requiere conexión a internet. Estamos trabajando en una versión PWA que funciona offline para el módulo POS, disponible en el plan Empresarial.',
  },
  {
    pregunta: '¿Tienen soporte en español?',
    respuesta:
      'Sí, todo el sistema está en español dominicano. El soporte es por WhatsApp en horario extendido (8am–8pm de lunes a sábado) y por email los domingos.',
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-white py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Preguntas frecuentes
          </h2>
          <p className="text-lg text-slate-600">
            Si tienes otra pregunta, escríbenos por WhatsApp.
          </p>
        </div>

        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-sm font-semibold text-slate-900 sm:text-base">
                  {faq.pregunta}
                </span>
                <span
                  className={`mt-0.5 shrink-0 text-slate-400 transition-transform duration-200${open === i ? ' rotate-180' : ''}`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm leading-relaxed text-slate-600">{faq.respuesta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
