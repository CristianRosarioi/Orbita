import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { RegistrarPagoSchema } from '@/lib/validations/inmobiliaria';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'Formato inválido.', 400);

    const parsed = RegistrarPagoSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const contrato = await prisma.contratoAlquiler.findFirst({
      where: { id, empresaId },
    });
    if (!contrato) return err('NOT_FOUND', 'Contrato no encontrado.', 404);

    const pagoExistente = await prisma.pagoAlquiler.findUnique({
      where: { contratoId_mes: { contratoId: id, mes: parsed.data.mes } },
    });
    if (pagoExistente?.estado === 'PAGADO') {
      return err('CONFLICT', `El pago del mes ${parsed.data.mes} ya fue registrado.`, 409);
    }

    const pago = await prisma.pagoAlquiler.upsert({
      where: { contratoId_mes: { contratoId: id, mes: parsed.data.mes } },
      update: {
        monto: parsed.data.monto,
        estado: 'PAGADO',
        pagadoEn: new Date(),
        notas: parsed.data.notas,
      },
      create: {
        contratoId: id,
        empresaId,
        mes: parsed.data.mes,
        monto: parsed.data.monto,
        estado: 'PAGADO',
        pagadoEn: new Date(),
        notas: parsed.data.notas,
      },
    });

    return ok(pago, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
