import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { enviarNotificacion } from '@/lib/notificaciones';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const TestSchema = z.object({
  canal: z.enum(['WHATSAPP', 'EMAIL']),
  destinatario: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos no es válido.', 400);

    const parsed = TestSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 400);

    const empresa = await prisma.empresa.findFirst({
      where: { id: empresaId },
      select: { nombre: true },
    });

    await enviarNotificacion({
      empresaId,
      tipo: 'BIENVENIDA',
      datos: { empresa: empresa?.nombre ?? 'Órbita' },
      destinatario: parsed.data.destinatario,
      canal: parsed.data.canal,
    });

    return ok({ enviado: true });
  } catch (e) {
    return handleApiError(e);
  }
}
