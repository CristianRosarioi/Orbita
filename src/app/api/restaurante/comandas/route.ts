import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateComandaSchema } from '@/lib/validations/restaurante';

const INDUSTRIAS_RESTAURANTE = ['RESTAURANTE'];

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_RESTAURANTE.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const { searchParams } = req.nextUrl;
    const estado = searchParams.get('estado') ?? undefined;
    const mesaId = searchParams.get('mesaId') ?? undefined;

    const comandas = await prisma.comanda.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        ...(estado && { estado: estado as never }),
        ...(mesaId && { mesaId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        mesa: { select: { numero: true, nombre: true } },
        _count: { select: { items: true } },
      },
    });

    return ok(comandas);
  } catch (error) {
    return handleApiError(error, 'GET /api/restaurante/comandas');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_RESTAURANTE.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para restaurantes.', 403);

    const body = await req.json();
    const parsed = CreateComandaSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const { mesaId, mesero, personas, notas } = parsed.data;
    const empresaId = sesion.empresaActivaId;

    // Verificar mesa si se indicó
    if (mesaId) {
      const mesa = await prisma.mesa.findFirst({
        where: { id: mesaId, empresaId, activa: true },
      });
      if (!mesa) return err('NOT_FOUND', 'Mesa no encontrada.', 404);
      if (mesa.estado === 'INACTIVA')
        return err('VALIDATION_ERROR', 'No se puede crear una comanda en una mesa inactiva.', 422);
    }

    // Número correlativo por empresa
    const comanda = await prisma.$transaction(async (tx) => {
      const maxNumero = await tx.comanda.aggregate({
        where: { empresaId },
        _max: { numero: true },
      });
      const numero = (maxNumero._max.numero ?? 0) + 1;

      const nueva = await tx.comanda.create({
        data: {
          empresaId,
          mesaId,
          numero,
          mesero,
          personas,
          notas,
          creadoPor: userId,
        },
      });

      // Marcar mesa como ocupada
      if (mesaId) {
        await tx.mesa.update({
          where: { id: mesaId },
          data: { estado: 'OCUPADA' },
        });
      }

      return nueva;
    });

    return created(comanda);
  } catch (error) {
    return handleApiError(error, 'POST /api/restaurante/comandas');
  }
}
