import { type NextRequest } from 'next/server';
import { ok, err, handleApiError } from '@/lib/api-response';
import { enviarNotificacion } from '@/lib/notificaciones';
import { z } from 'zod';

const TriggerSchema = z.object({
  empresaId:    z.string().min(1),
  tipo:         z.enum(['FACTURA_EMITIDA', 'FACTURA_VENCIDA', 'PAGO_RECIBIDO', 'CITA_RECORDATORIO', 'STOCK_BAJO', 'NOMINA_PROCESADA', 'BIENVENIDA']),
  destinatario: z.string().min(1),
  datos:        z.record(z.string(), z.string()).default({}),
  referencia:   z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Proteger con INTERNAL_API_KEY
    const apiKey = req.headers.get('x-internal-key');
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
      return err('UNAUTHORIZED', 'Clave de API interna inválida.', 401);
    }

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos no es válido.', 400);

    const parsed = TriggerSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 400);

    const { empresaId, tipo, destinatario, datos, referencia } = parsed.data;

    await enviarNotificacion({ empresaId, tipo, datos, destinatario, referencia });

    return ok({ disparado: true });
  } catch (e) {
    return handleApiError(e);
  }
}
