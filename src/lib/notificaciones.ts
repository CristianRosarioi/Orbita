import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import type { TipoNotificacion, CanalNotificacion } from '@/generated/prisma/client';

// ─── Templates ──────────────────────────────────────────────────────────────

export interface DatosNotificacion {
  nombre?: string;
  numero?: string;       // número de factura
  total?: string;
  monto?: string;
  empresa?: string;
  telefono?: string;
  fecha?: string;
  hora?: string;
  producto?: string;
  cantidad?: string;
}

function renderTemplate(tipo: TipoNotificacion, datos: DatosNotificacion): string {
  const d = datos;
  switch (tipo) {
    case 'FACTURA_EMITIDA':
      return `Hola ${d.nombre ?? 'cliente'}, tu factura #${d.numero ?? '-'} por RD$${d.total ?? '0'} ha sido emitida. Gracias por tu compra en ${d.empresa ?? 'nuestra empresa'}.`;
    case 'FACTURA_VENCIDA':
      return `Hola ${d.nombre ?? 'cliente'}, tu factura #${d.numero ?? '-'} por RD$${d.total ?? '0'} está vencida. Por favor contáctanos para regularizarla. ${d.empresa ?? ''} - ${d.telefono ?? ''}`;
    case 'PAGO_RECIBIDO':
      return `Hola ${d.nombre ?? 'cliente'}, hemos recibido tu pago de RD$${d.monto ?? '0'} para la factura #${d.numero ?? '-'}. ¡Gracias! ${d.empresa ?? ''}`;
    case 'CITA_RECORDATORIO':
      return `Hola ${d.nombre ?? 'cliente'}, te recordamos tu cita mañana ${d.fecha ?? '-'} a las ${d.hora ?? '-'} en ${d.empresa ?? 'nuestra empresa'}. Si necesitas cambiarla llámanos al ${d.telefono ?? '-'}.`;
    case 'STOCK_BAJO':
      return `Alerta de inventario: El producto '${d.producto ?? '-'}' tiene solo ${d.cantidad ?? '0'} unidades en stock. ${d.empresa ?? ''}`;
    case 'NOMINA_PROCESADA':
      return `La nómina ha sido procesada exitosamente en ${d.empresa ?? 'nuestra empresa'}.`;
    case 'BIENVENIDA':
      return `Hola ${d.nombre ?? ''}, bienvenido/a a ${d.empresa ?? 'Órbita'}. Tu cuenta está lista para usar.`;
    default:
      return '';
  }
}

function asuntoTemplate(tipo: TipoNotificacion): string {
  switch (tipo) {
    case 'FACTURA_EMITIDA':    return 'Tu factura ha sido emitida';
    case 'FACTURA_VENCIDA':    return 'Factura vencida — acción requerida';
    case 'PAGO_RECIBIDO':      return 'Confirmación de pago recibido';
    case 'CITA_RECORDATORIO':  return 'Recordatorio de cita';
    case 'STOCK_BAJO':         return 'Alerta de stock bajo';
    case 'NOMINA_PROCESADA':   return 'Nómina procesada';
    case 'BIENVENIDA':         return '¡Bienvenido/a!';
    default:                   return 'Notificación';
  }
}

// ─── Canales ────────────────────────────────────────────────────────────────

export async function enviarWhatsApp(
  numero: string,
  mensaje: string,
  apiKey: string,
): Promise<boolean> {
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(numero)}&text=${encodeURIComponent(mensaje)}&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function enviarEmail(
  destinatario: string,
  asunto: string,
  html: string,
  remitente?: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const resend = new Resend(apiKey);
    const from = remitente ?? 'Órbita RD <noreply@orbita.do>';
    const { error } = await resend.emails.send({ from, to: destinatario, subject: asunto, html });
    return !error;
  } catch {
    return false;
  }
}

// ─── Orquestador principal ──────────────────────────────────────────────────

export interface OpcionesNotificacion {
  empresaId: string;
  tipo: TipoNotificacion;
  datos: DatosNotificacion;
  destinatario: string;         // teléfono o email según canal
  referencia?: string;
  canal?: CanalNotificacion;    // si se omite, usa lo configurado
}

export async function enviarNotificacion(opciones: OpcionesNotificacion): Promise<void> {
  const { empresaId, tipo, datos, destinatario, referencia, canal: canalForzado } = opciones;

  const config = await prisma.configNotificacion.findUnique({ where: { empresaId } });
  if (!config) return;

  // Verificar si este tipo está habilitado
  const habilitado = (() => {
    switch (tipo) {
      case 'FACTURA_EMITIDA':   return config.notifFacturas;
      case 'FACTURA_VENCIDA':   return config.notifVencimientos;
      case 'PAGO_RECIBIDO':     return config.notifFacturas;
      case 'CITA_RECORDATORIO': return config.notifCitas;
      case 'STOCK_BAJO':        return config.notifStockBajo;
      case 'NOMINA_PROCESADA':  return config.notifNomina;
      default:                  return true;
    }
  })();
  if (!habilitado) return;

  const canal: CanalNotificacion = canalForzado ?? (
    config.whatsappActivo && config.emailActivo ? 'AMBOS' :
    config.whatsappActivo ? 'WHATSAPP' : 'EMAIL'
  );

  const mensaje = renderTemplate(tipo, datos);
  const asunto = asuntoTemplate(tipo);
  const htmlEmail = `<p style="font-family:sans-serif">${mensaje.replace(/\n/g, '<br>')}</p>`;

  // Crear registro pendiente
  const notif = await prisma.notificacion.create({
    data: {
      empresaId,
      tipo,
      canal,
      destinatario,
      asunto,
      mensaje,
      referencia: referencia ?? null,
      estado: 'PENDIENTE',
    },
  });

  let exito = false;
  let errorMsg: string | undefined;
  let intentos = 0;

  try {
    if (canal === 'WHATSAPP' || canal === 'AMBOS') {
      if (config.whatsappActivo && config.whatsappNumero && config.whatsappApiKey) {
        intentos++;
        const ok = await enviarWhatsApp(destinatario, mensaje, config.whatsappApiKey);
        if (ok) exito = true;
        else errorMsg = 'Fallo al enviar por WhatsApp';
      }
    }

    if (canal === 'EMAIL' || canal === 'AMBOS') {
      if (config.emailActivo) {
        intentos++;
        const ok = await enviarEmail(destinatario, asunto, htmlEmail, config.emailRemitente ?? undefined);
        if (ok) exito = true;
        else errorMsg = (errorMsg ? errorMsg + ' | ' : '') + 'Fallo al enviar por email';
      }
    }
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : 'Error desconocido';
  }

  await prisma.notificacion.update({
    where: { id: notif.id },
    data: {
      estado: exito ? 'ENVIADA' : 'FALLIDA',
      enviadaEn: exito ? new Date() : null,
      intentos,
      errorMsg: errorMsg ?? null,
    },
  });
}

// Re-export template renderer for tests
export { renderTemplate };
