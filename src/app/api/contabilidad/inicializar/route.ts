import { auth } from '@clerk/nextjs/server';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPlanCuentasBase } from '@/lib/plan-cuentas';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    await requireRole(['OWNER', 'ADMIN']);
    const empresaId = await requireEmpresa();

    const cuenta = await prisma.cuentaContable.findFirst({
      where: { empresaId, deletedAt: null },
      select: { id: true },
    });

    if (cuenta) {
      return err('CONFLICT', 'Esta empresa ya tiene un plan de cuentas inicializado.', 409);
    }

    const cuentas = getPlanCuentasBase();
    await prisma.cuentaContable.createMany({
      data: cuentas.map((c) => ({
        empresaId,
        codigo: c.codigo,
        nombre: c.nombre,
        tipo: c.tipo,
        padre: c.padre,
        esBase: true,
      })),
    });

    return ok({ cuentasCreadas: cuentas.length }, 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/contabilidad/inicializar');
  }
}
