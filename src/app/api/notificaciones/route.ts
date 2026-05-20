import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';

const FiltrosSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  tipo:   z.string().optional(),
  estado: z.string().optional(),
  desde:  z.string().optional(),
  hasta:  z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const empresaId = await requireEmpresa();
    const { searchParams } = req.nextUrl;

    const filtros = FiltrosSchema.safeParse({
      page:   searchParams.get('page') ?? '1',
      limit:  searchParams.get('limit') ?? '20',
      tipo:   searchParams.get('tipo') ?? undefined,
      estado: searchParams.get('estado') ?? undefined,
      desde:  searchParams.get('desde') ?? undefined,
      hasta:  searchParams.get('hasta') ?? undefined,
    });

    if (!filtros.success) return err('VALIDATION_ERROR', 'Parámetros inválidos.', 400);

    const { page, limit, tipo, estado, desde, hasta } = filtros.data;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificacionWhereInput = {
      empresaId,
      ...(tipo   && { tipo:   tipo   as never }),
      ...(estado && { estado: estado as never }),
      ...((desde || hasta) && {
        createdAt: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(hasta) } : {}),
        },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.notificacion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notificacion.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
