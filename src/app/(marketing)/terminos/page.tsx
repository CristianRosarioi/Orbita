export const metadata = {
  title: 'Términos de Servicio — Órbita RD',
  description: 'Términos y condiciones de uso de la plataforma Órbita RD.',
};

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="mb-2 text-4xl font-bold text-slate-900">Términos de Servicio</h1>
      <p className="mb-10 text-sm text-slate-400">Última actualización: enero 2026</p>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">1. Aceptación de los términos</h2>
          <p className="text-slate-600 leading-relaxed">
            Al acceder y utilizar la plataforma Órbita RD, aceptas estar vinculado por estos términos de servicio.
            Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar nuestros servicios.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">2. Descripción del servicio</h2>
          <p className="text-slate-600 leading-relaxed">
            Órbita RD es un sistema de gestión empresarial SaaS (Software as a Service) diseñado para
            negocios dominicanos. Ofrece módulos de facturación, inventario, nómina, reportes DGII y más,
            accesibles mediante suscripción mensual.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">3. Cuentas de usuario</h2>
          <p className="text-slate-600 leading-relaxed">
            Para utilizar Órbita RD debes crear una cuenta con información veraz y actualizada. Eres
            responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que
            ocurran bajo tu cuenta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">4. Pagos y suscripción</h2>
          <p className="text-slate-600 leading-relaxed">
            Los planes de suscripción se facturan mensualmente en pesos dominicanos (DOP). Ofrecemos un
            período de prueba gratuita de 15 días. Puedes cancelar tu suscripción en cualquier momento;
            el acceso continuará hasta el final del período pagado.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">5. Privacidad y datos</h2>
          <p className="text-slate-600 leading-relaxed">
            El manejo de tus datos personales y empresariales se rige por nuestra{' '}
            <a href="/privacidad" className="text-indigo-600 underline hover:no-underline">
              Política de Privacidad
            </a>
            . Nos comprometemos a proteger la información de tu negocio y la de tus clientes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">6. Limitación de responsabilidad</h2>
          <p className="text-slate-600 leading-relaxed">
            Órbita RD no se hace responsable de errores en los cálculos fiscales derivados de información
            incorrecta ingresada por el usuario. Es responsabilidad del negocio verificar la exactitud de
            los datos fiscales presentados ante la DGII.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">7. Modificaciones</h2>
          <p className="text-slate-600 leading-relaxed">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
            significativos serán notificados con al menos 30 días de anticipación.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">8. Contacto</h2>
          <p className="text-slate-600 leading-relaxed">
            Para preguntas sobre estos términos, contáctanos en{' '}
            <a href="mailto:contacto.orbitard@gmail.com" className="text-indigo-600 underline hover:no-underline">
              contacto.orbitard@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
