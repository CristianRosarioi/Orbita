import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';

const INDUSTRIAS_SUPER = ['SUPERMERCADO', 'MINIMARKET', 'COLMADO_GRANDE'];

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SUPER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para supermercados.', 403);

    const empresaId = sesion.empresaActiva.id;
    const now = new Date();

    const ofertas = await prisma.oferta.findMany({
      where: {
        empresaId,
        activa: true,
        fechaInicio: { lte: now },
        fechaFin: { gte: now },
      },
      orderBy: { descuento: 'desc' },
      include: {
        producto: { select: { id: true, nombre: true, sku: true, codigoBarras: true } },
        categoria: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json({ success: true, data: ofertas });
  } catch (e) {
    return handleApiError(e);
  }
}
