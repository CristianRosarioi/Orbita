export const metadata = {
  title: 'Política de Privacidad — Órbita RD',
  description: 'Política de privacidad y tratamiento de datos de la plataforma Órbita RD.',
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="mb-2 text-4xl font-bold text-slate-900">Política de Privacidad</h1>
      <p className="mb-10 text-sm text-slate-400">Última actualización: enero 2026</p>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">1. Información que recopilamos</h2>
          <p className="text-slate-600 leading-relaxed">
            Recopilamos información que proporcionas directamente, como nombre, correo electrónico,
            información de la empresa, y datos fiscales (RNC, NCF). También recopilamos datos de uso
            para mejorar el servicio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">2. Cómo usamos la información</h2>
          <p className="text-slate-600 leading-relaxed">
            Utilizamos la información para:
          </p>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              Proveer, mantener y mejorar nuestros servicios
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              Procesar transacciones y enviar notificaciones
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              Cumplir con obligaciones legales y fiscales
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              Ofrecer soporte técnico
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">3. Compartir información</h2>
          <p className="text-slate-600 leading-relaxed">
            No vendemos ni alquilamos tu información personal a terceros. Podemos compartir información
            con proveedores de servicios que nos ayudan a operar la plataforma, siempre bajo acuerdos
            de confidencialidad. En ningún caso compartimos datos de tus clientes o transacciones
            comerciales sin tu consentimiento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">4. Seguridad de datos</h2>
          <p className="text-slate-600 leading-relaxed">
            Implementamos medidas de seguridad técnicas y organizativas para proteger tu información,
            incluyendo cifrado en tránsito (HTTPS) y en reposo. Sin embargo, ningún sistema es 100%
            seguro, por lo que te recomendamos usar contraseñas fuertes y únicas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">5. Retención de datos</h2>
          <p className="text-slate-600 leading-relaxed">
            Conservamos tus datos mientras tu cuenta esté activa o según sea necesario para cumplir
            con obligaciones legales. Al cancelar tu cuenta, los datos serán eliminados en un plazo
            de 90 días, excepto cuando la ley requiera conservarlos por más tiempo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">6. Tus derechos</h2>
          <p className="text-slate-600 leading-relaxed">
            Tienes derecho a acceder, corregir o eliminar tu información personal. Para ejercer
            estos derechos, contáctanos en{' '}
            <a href="mailto:contacto.orbitard@gmail.com" className="text-indigo-600 underline hover:no-underline">
              contacto.orbitard@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">7. Cookies</h2>
          <p className="text-slate-600 leading-relaxed">
            Usamos cookies esenciales para mantener tu sesión iniciada y preferencias de la aplicación.
            No usamos cookies de rastreo publicitario de terceros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">8. Cambios a esta política</h2>
          <p className="text-slate-600 leading-relaxed">
            Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios
            significativos por correo electrónico o mediante un aviso prominente en la plataforma.
          </p>
        </section>
      </div>
    </div>
  );
}
