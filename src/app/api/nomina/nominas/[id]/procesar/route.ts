import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { id } = await params;
    const nomina = await prisma.nomina.findFirst({
      where: { id, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!nomina) return err('NOT_FOUND', 'Nómina no encontrada.', 404);
    if (nomina.estado !== 'BORRADOR')
      return err('VALIDATION_ERROR', 'Solo se pueden procesar nóminas en borrador.', 422);

    const actualizada = await prisma.nomina.update({
      where: { id },
      data: { estado: 'PROCESADA', procesadaEn: new Date() },
    });

    return ok(actualizada);
  } catch (error) {
    return handleApiError(error, 'POST /api/nomina/nominas/[id]/procesar');
  }
}
