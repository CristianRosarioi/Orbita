import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// Balance general: suma de débitos y créditos por cuenta agrupada por tipo
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const cuentas = await prisma.cuentaContable.findMany({
      where: { empresaId, deletedAt: null },
      include: {
        lineas: {
          select: { tipo: true, monto: true },
        },
      },
      orderBy: { codigo: 'asc' },
    });

    const balance = cuentas.map((cuenta) => {
      let debitos = 0;
      let creditos = 0;
      for (const l of cuenta.lineas) {
        if (l.tipo === 'DEBITO') debitos += Number(l.monto);
        else creditos += Number(l.monto);
      }

      // Saldo normal según tipo de cuenta
      const saldo =
        cuenta.tipo === 'ACTIVO' || cuenta.tipo === 'GASTO'
          ? debitos - creditos // cuentas de saldo deudor
          : creditos - debitos; // cuentas de saldo acreedor

      return {
        id: cuenta.id,
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        padre: cuenta.padre,
        debitos,
        creditos,
        saldo,
      };
    });

    // Totales por tipo
    const totales = {
      activo: balance.filter((c) => c.tipo === 'ACTIVO').reduce((s, c) => s + c.saldo, 0),
      pasivo: balance.filter((c) => c.tipo === 'PASIVO').reduce((s, c) => s + c.saldo, 0),
      patrimonio: balance.filter((c) => c.tipo === 'PATRIMONIO').reduce((s, c) => s + c.saldo, 0),
      ingreso: balance.filter((c) => c.tipo === 'INGRESO').reduce((s, c) => s + c.saldo, 0),
      gasto: balance.filter((c) => c.tipo === 'GASTO').reduce((s, c) => s + c.saldo, 0),
    };

    return ok({ cuentas: balance, totales });
  } catch (error) {
    return handleApiError(error, 'GET /api/contabilidad/balance');
  }
}
