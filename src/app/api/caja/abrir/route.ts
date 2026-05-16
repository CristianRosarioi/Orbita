import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa, getCurrentUser } from '@/lib/auth';
import { AbrirCajaSchema } from '@/lib/validations/caja';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const usuario = await getCurrentUser();
    if (!usuario) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    // Verificar que no haya una caja ya abierta para este usuario
    const cajaActiva = await prisma.sesionCaja.findFirst({
      where: { empresaId, usuarioId: usuario.id, estado: 'ABIERTA' },
    });
    if (cajaActiva) {
      return err(
        'CAJA_YA_ABIERTA',
        'Ya tienes una caja abierta. Ciérrala antes de abrir una nueva.',
        409,
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = AbrirCajaSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const sesion = await prisma.sesionCaja.create({
      data: {
        empresaId,
        usuarioId: usuario.id,
        sucursalId: parsed.data.sucursalId ?? null,
        montoApertura: parsed.data.montoApertura,
        notas: parsed.data.notas ?? null,
        estado: 'ABIERTA',
      },
    });

    return ok(sesion, 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/caja/abrir');
  }
}
