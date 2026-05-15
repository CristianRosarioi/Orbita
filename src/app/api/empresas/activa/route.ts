import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';

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
        direccion: true,
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
