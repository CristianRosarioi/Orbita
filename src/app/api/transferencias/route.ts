import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateTransferenciaSchema } from '@/lib/validations/sucursales';
import { ejecutarTransferencia } from '@/lib/transferencias';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('UNAUTHORIZED', 'Selecciona una empresa activa.', 401);

    const { searchParams } = req.nextUrl;
    const sucursalId = searchParams.get('sucursalId');
    const productoId = searchParams.get('productoId');

    const transferencias = await prisma.transferenciaInventario.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        ...(sucursalId
          ? { OR: [{ sucursalOrigenId: sucursalId }, { sucursalDestinoId: sucursalId }] }
          : {}),
        ...(productoId ? { productoId } : {}),
      },
      include: {
        sucursalOrigen: { select: { id: true, nombre: true, codigo: true } },
        sucursalDestino: { select: { id: true, nombre: true, codigo: true } },
        producto: { select: { id: true, nombre: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return ok(transferencias);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('UNAUTHORIZED', 'Selecciona una empresa activa.', 401);

    const body = await req.json();
    const parsed = CreateTransferenciaSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos.', 400);

    const producto = await prisma.producto.findFirst({
      where: { id: parsed.data.productoId, empresaId: sesion.empresaActivaId, deletedAt: null },
    });
    if (!producto) return err('NOT_FOUND', 'Producto no encontrado.', 404);

    let transferencia;
    try {
      transferencia = await ejecutarTransferencia(sesion.empresaActivaId, parsed.data, userId);
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'ORIGEN_NOT_FOUND') return err('NOT_FOUND', 'Sucursal de origen no encontrada.', 404);
        if (e.message === 'DESTINO_NOT_FOUND') return err('NOT_FOUND', 'Sucursal de destino no encontrada.', 404);
        if (e.message === 'STOCK_INSUFICIENTE') return err('FORBIDDEN', 'Stock insuficiente en la sucursal de origen.', 422);
      }
      throw e;
    }

    return created(transferencia);
  } catch (e) {
    return handleApiError(e);
  }
}
