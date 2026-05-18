import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateGastoSchema } from '@/lib/validations/compras';
import { crearAsientoGasto } from '@/lib/asientos';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const { searchParams } = req.nextUrl;
    const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : undefined;
    const anio = searchParams.get('anio') ? parseInt(searchParams.get('anio')!) : undefined;
    const categoria = searchParams.get('categoria') ?? undefined;

    const where: Record<string, unknown> = {
      empresaId: sesion.empresaActivaId,
      deletedAt: null,
      ...(categoria && { categoria }),
    };

    if (mes && anio) {
      const inicio = new Date(anio, mes - 1, 1);
      const fin = new Date(anio, mes, 0, 23, 59, 59);
      where.fechaGasto = { gte: inicio, lte: fin };
    } else if (anio) {
      const inicio = new Date(anio, 0, 1);
      const fin = new Date(anio, 11, 31, 23, 59, 59);
      where.fechaGasto = { gte: inicio, lte: fin };
    }

    const gastos = await prisma.gasto.findMany({
      where: where as never,
      orderBy: { fechaGasto: 'desc' },
      include: {
        proveedor: { select: { id: true, nombre: true, identificacion: true } },
      },
    });

    return ok(gastos);
  } catch (error) {
    return handleApiError(error, 'GET /api/compras/gastos');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const empresaId = sesion.empresaActivaId;
    const body = await req.json();
    const parsed = CreateGastoSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    if (parsed.data.proveedorId) {
      const proveedor = await prisma.proveedor.findFirst({
        where: { id: parsed.data.proveedorId, empresaId, deletedAt: null },
      });
      if (!proveedor) return err('NOT_FOUND', 'Proveedor no encontrado.', 404);
    }

    const total = Math.round((parsed.data.monto + parsed.data.itbis) * 100) / 100;

    const gasto = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.gasto.create({
        data: {
          empresaId,
          proveedorId: parsed.data.proveedorId,
          descripcion: parsed.data.descripcion,
          monto: parsed.data.monto,
          itbis: parsed.data.itbis,
          total,
          categoria: parsed.data.categoria,
          fechaGasto: new Date(parsed.data.fechaGasto),
          comprobante: parsed.data.comprobante,
          ncfProveedor: parsed.data.ncfProveedor,
          notas: parsed.data.notas,
          creadoPor: userId,
        },
        include: { proveedor: { select: { nombre: true } } },
      });

      await crearAsientoGasto(nuevo.id, empresaId, userId, tx);
      return nuevo;
    });

    return created(gasto);
  } catch (error) {
    return handleApiError(error, 'POST /api/compras/gastos');
  }
}
