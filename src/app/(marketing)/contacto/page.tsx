export const metadata = {
  title: 'Contacto — Órbita RD',
  description: 'Comunícate con el equipo de Órbita. Estamos disponibles por WhatsApp, email, Instagram y Facebook.',
};

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-slate-900">Contáctanos</h1>
        <p className="text-lg text-slate-600">
          Estamos disponibles para ayudarte a configurar Órbita para tu negocio.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-green-200 bg-green-50 p-6 transition-colors hover:bg-green-100">
          <div className="mb-3 text-3xl">💬</div>
          <h2 className="mb-1 font-bold text-slate-900">WhatsApp</h2>
          <p className="mb-5 flex-1 text-sm text-slate-600">Escríbenos directo, respuesta rápida</p>
          <a
            href="https://wa.me/18298179643"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl bg-green-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            Escribir por WhatsApp
          </a>
        </div>

        <div className="flex flex-col rounded-2xl border border-blue-200 bg-blue-50 p-6 transition-colors hover:bg-blue-100">
          <div className="mb-3 text-3xl">📧</div>
          <h2 className="mb-1 font-bold text-slate-900">Email</h2>
          <p className="mb-5 flex-1 text-sm text-slate-600">contacto.orbitard@gmail.com</p>
          <a
            href="mailto:contacto.orbitard@gmail.com"
            className="block rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Enviar email
          </a>
        </div>

        <div className="flex flex-col rounded-2xl border border-pink-200 bg-pink-50 p-6 transition-colors hover:bg-pink-100">
          <div className="mb-3 text-3xl">📸</div>
          <h2 className="mb-1 font-bold text-slate-900">Instagram</h2>
          <p className="mb-5 flex-1 text-sm text-slate-600">@orbita_rd</p>
          <a
            href="https://www.instagram.com/orbita_rd/"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl bg-pink-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-pink-700"
          >
            Ver en Instagram
          </a>
        </div>

        <div className="flex flex-col rounded-2xl border border-indigo-200 bg-indigo-50 p-6 transition-colors hover:bg-indigo-100">
          <div className="mb-3 text-3xl">👍</div>
          <h2 className="mb-1 font-bold text-slate-900">Facebook</h2>
          <p className="mb-5 flex-1 text-sm text-slate-600">OrbitaRD</p>
          <a
            href="https://www.facebook.com/OrbitaRD/"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Ver en Facebook
          </a>
        </div>
      </div>

      <div className="mt-12 rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center">
        <h2 className="mb-2 text-xl font-bold text-slate-900">Horario de atención</h2>
        <p className="text-slate-600">Lunes a viernes: 9:00 AM – 6:00 PM (hora RD)</p>
        <p className="text-slate-600">Sábados: 9:00 AM – 1:00 PM</p>
      </div>
    </div>
  );
}
