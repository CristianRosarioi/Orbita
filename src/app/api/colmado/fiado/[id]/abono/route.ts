import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { AbonoFiadoSchema } from '@/lib/validations/colmado';

const INDUSTRIAS_COLMADO = ['COLMADO', 'TIENDA_ONLINE', 'FARMACIA', 'TIENDA_ROPA'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_COLMADO.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo no está disponible para tu industria.', 403);

    const { id } = await params;
    const cuenta = await prisma.cuentaFiado.findFirst({
      where: { id, empresaId: sesion.empresaActivaId },
    });
    if (!cuenta) return err('NOT_FOUND', 'Cuenta de fiado no encontrada.', 404);

    const body = await req.json();
    const parsed = AbonoFiadoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const nuevoSaldo = Math.max(0, Number(cuenta.saldo) - parsed.data.monto);

    const movimiento = await prisma.$transaction(async (tx) => {
      const mov = await tx.movimientoFiado.create({
        data: {
          cuentaFiadoId: id,
          empresaId: sesion.empresaActivaId,
          tipo: 'ABONO',
          monto: parsed.data.monto,
          descripcion: parsed.data.descripcion,
          registradoPor: userId,
        },
      });

      let nuevoEstado: 'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO' = 'PENDIENTE';
      if (nuevoSaldo === 0) nuevoEstado = 'PAGADO';
      else if (parsed.data.monto < Number(cuenta.saldo)) nuevoEstado = 'PAGADO_PARCIAL';

      await tx.cuentaFiado.update({
        where: { id },
        data: { saldo: nuevoSaldo, estado: nuevoEstado },
      });

      return mov;
    });

    return created(movimiento);
  } catch (error) {
    return handleApiError(error, 'POST /api/colmado/fiado/[id]/abono');
  }
}
