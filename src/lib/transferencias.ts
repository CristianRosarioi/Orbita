import { prisma } from '@/lib/prisma';
import type { CreateTransferenciaInput } from '@/lib/validations/sucursales';

export async function ejecutarTransferencia(
  empresaId: string,
  data: CreateTransferenciaInput,
  creadoPor: string,
) {
  return prisma.$transaction(async (tx) => {
    const [origen, destino] = await Promise.all([
      tx.sucursal.findFirst({
        where: { id: data.sucursalOrigenId, empresaId, activa: true, deletedAt: null },
      }),
      tx.sucursal.findFirst({
        where: { id: data.sucursalDestinoId, empresaId, activa: true, deletedAt: null },
      }),
    ]);

    if (!origen) throw new Error('ORIGEN_NOT_FOUND');
    if (!destino) throw new Error('DESTINO_NOT_FOUND');

    const stockOrigen = await tx.stockSucursal.findUnique({
      where: { sucursalId_productoId: { sucursalId: data.sucursalOrigenId, productoId: data.productoId } },
    });

    const cantidadDisponible = stockOrigen?.cantidad ?? 0;
    if (Number(cantidadDisponible) < data.cantidad) {
      throw new Error('STOCK_INSUFICIENTE');
    }

    await tx.stockSucursal.update({
      where: { sucursalId_productoId: { sucursalId: data.sucursalOrigenId, productoId: data.productoId } },
      data: { cantidad: { decrement: data.cantidad } },
    });

    await tx.stockSucursal.upsert({
      where: { sucursalId_productoId: { sucursalId: data.sucursalDestinoId, productoId: data.productoId } },
      create: {
        empresaId,
        sucursalId: data.sucursalDestinoId,
        productoId: data.productoId,
        cantidad: data.cantidad,
      },
      update: { cantidad: { increment: data.cantidad } },
    });

    const transferencia = await tx.transferenciaInventario.create({
      data: {
        empresaId,
        sucursalOrigenId: data.sucursalOrigenId,
        sucursalDestinoId: data.sucursalDestinoId,
        productoId: data.productoId,
        cantidad: data.cantidad,
        notas: data.notas,
        estado: 'COMPLETADA',
        creadoPor,
      },
    });

    return transferencia;
  });
}
