import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const cuentas = await prisma.cuentaContable.findMany({
      where: { empresaId, deletedAt: null },
      orderBy: { codigo: 'asc' },
    });

    return ok(cuentas);
  } catch (error) {
    return handleApiError(error, 'GET /api/contabilidad/cuentas');
  }
}
