-- CreateEnum
CREATE TYPE "estado_transferencia" AS ENUM ('PENDIENTE', 'COMPLETADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "movimientos_inventario" ADD COLUMN     "sucursal_id" TEXT;

-- AlterTable
ALTER TABLE "sucursales" ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "encargado" TEXT;

-- CreateTable
CREATE TABLE "stock_sucursal" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencias_inventario" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_origen_id" TEXT NOT NULL,
    "sucursal_destino_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "notas" TEXT,
    "estado" "estado_transferencia" NOT NULL DEFAULT 'COMPLETADA',
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transferencias_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_sucursal_empresa_id_sucursal_id_idx" ON "stock_sucursal"("empresa_id", "sucursal_id");

-- CreateIndex
CREATE INDEX "stock_sucursal_producto_id_idx" ON "stock_sucursal"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_sucursal_sucursal_id_producto_id_key" ON "stock_sucursal"("sucursal_id", "producto_id");

-- CreateIndex
CREATE INDEX "transferencias_inventario_empresa_id_idx" ON "transferencias_inventario"("empresa_id");

-- CreateIndex
CREATE INDEX "transferencias_inventario_sucursal_origen_id_idx" ON "transferencias_inventario"("sucursal_origen_id");

-- CreateIndex
CREATE INDEX "transferencias_inventario_sucursal_destino_id_idx" ON "transferencias_inventario"("sucursal_destino_id");

-- CreateIndex
CREATE INDEX "transferencias_inventario_producto_id_idx" ON "transferencias_inventario"("producto_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_sucursal_id_idx" ON "movimientos_inventario"("sucursal_id");

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_sucursal" ADD CONSTRAINT "stock_sucursal_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_sucursal" ADD CONSTRAINT "stock_sucursal_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_sucursal" ADD CONSTRAINT "stock_sucursal_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_inventario" ADD CONSTRAINT "transferencias_inventario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_inventario" ADD CONSTRAINT "transferencias_inventario_sucursal_origen_id_fkey" FOREIGN KEY ("sucursal_origen_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_inventario" ADD CONSTRAINT "transferencias_inventario_sucursal_destino_id_fkey" FOREIGN KEY ("sucursal_destino_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_inventario" ADD CONSTRAINT "transferencias_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
