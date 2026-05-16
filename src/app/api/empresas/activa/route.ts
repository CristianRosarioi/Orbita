import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa, requireRole } from '@/lib/auth';
import { z } from 'zod';

const ActualizarEmpresaSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  nombreComercial: z.string().min(2).max(100).optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  email: z.string().email().max(100).optional().nullable(),
  direccion: z.string().max(300).optional().nullable(),
  logoUrl: z.string().url().max(500).optional().nullable(),
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const empresa = await prisma.empresa.findFirst({
      where: { id: empresaId, deletedAt: null },
      select: {
        id: true,
        nombre: true,
        nombreComercial: true,
        telefono: true,
        email: true,
        direccion: true,
        logoUrl: true,
        modoFiscal: true,
        rnc: true,
      },
    });

    if (!empresa) return err('NOT_FOUND', 'Empresa no encontrada.', 404);

    return ok(empresa);
  } catch (error) {
    return handleApiError(error, 'GET /api/empresas/activa');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    await requireRole(['OWNER', 'ADMIN']);
    const empresaId = await requireEmpresa();

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = ActualizarEmpresaSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const empresa = await prisma.empresa.update({
      where: { id: empresaId },
      data: parsed.data,
      select: {
        id: true,
        nombre: true,
        nombreComercial: true,
        telefono: true,
        email: true,
        direccion: true,
        logoUrl: true,
        modoFiscal: true,
        rnc: true,
      },
    });

    return ok(empresa);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/empresas/activa');
  }
}
