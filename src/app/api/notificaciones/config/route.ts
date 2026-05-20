import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { z } from 'zod';

const ConfigSchema = z.object({
  whatsappActivo: z.boolean().optional(),
  emailActivo: z.boolean().optional(),
  whatsappNumero: z.string().max(20).optional().nullable(),
  whatsappApiKey: z.string().max(200).optional().nullable(),
  emailRemitente: z.string().email().optional().nullable(),
  notifFacturas: z.boolean().optional(),
  notifVencimientos: z.boolean().optional(),
  notifCitas: z.boolean().optional(),
  notifStockBajo: z.boolean().optional(),
  notifNomina: z.boolean().optional(),
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const config = await prisma.configNotificacion.findUnique({ where: { empresaId } });

    // Si no existe, devolver valores por defecto
    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          empresaId,
          whatsappActivo: false,
          emailActivo: false,
          whatsappNumero: null,
          whatsappApiKey: null,
          emailRemitente: null,
          notifFacturas: true,
          notifVencimientos: true,
          notifCitas: true,
          notifStockBajo: true,
          notifNomina: false,
        },
      });
    }

    return ok(config);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos no es válido.', 400);

    const parsed = ConfigSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 400);

    const config = await prisma.configNotificacion.upsert({
      where: { empresaId },
      update: parsed.data,
      create: { empresaId, ...parsed.data },
    });

    return ok(config);
  } catch (e) {
    return handleApiError(e);
  }
}
