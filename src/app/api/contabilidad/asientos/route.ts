import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const FiltrosSchema = z.object({
  page:   z.coerce.number().min(1).default(1),
  limit:  z.coerce.number().min(1).max(100).default(50),
  desde:  z.string().optional(),
  hasta:  z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();

    const url = new URL(req.url);
    const parsed = FiltrosSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Parámetros inválidos.', 422);
    }

    const { page, limit, desde, hasta } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      empresaId,
      ...(desde || hasta
        ? {
            fecha: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta ? { lte: new Date(hasta) } : {}),
            },
          }
        : {}),
    };

    const [asientos, total] = await Promise.all([
      prisma.asientoContable.findMany({
        where,
        include: {
          lineas: {
            include: { cuenta: true },
            orderBy: { tipo: 'asc' },
          },
        },
        orderBy: { numero: 'desc' },
        skip,
        take: limit,
      }),
      prisma.asientoContable.count({ where }),
    ]);

    return ok({ items: asientos, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error, 'GET /api/contabilidad/asientos');
  }
}
