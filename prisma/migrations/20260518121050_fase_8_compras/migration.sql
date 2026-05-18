-- CreateEnum
CREATE TYPE "estado_orden_compra" AS ENUM ('BORRADOR', 'ENVIADA', 'RECIBIDA_PARCIAL', 'RECIBIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "estado_gasto" AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO');

-- AlterTable
ALTER TABLE "asientos_contables" ADD COLUMN     "gasto_id" TEXT,
ADD COLUMN     "orden_compra_id" TEXT;

-- AlterTable
ALTER TABLE "movimientos_inventario" ADD COLUMN     "orden_compra_id" TEXT;

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "estado" "estado_orden_compra" NOT NULL DEFAULT 'BORRADOR',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "itbis" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "fecha_esperada" TIMESTAMP(3),
    "fecha_recibida" TIMESTAMP(3),
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_orden_compra" (
    "id" TEXT NOT NULL,
    "orden_compra_id" TEXT NOT NULL,
    "producto_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "cantidad_recibida" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "costo_unitario" DECIMAL(65,30) NOT NULL,
    "itbis_porcentaje" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "itbis_monto" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_orden_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "proveedor_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "itbis" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "categoria" TEXT,
    "estado" "estado_gasto" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_gasto" TIMESTAMP(3) NOT NULL,
    "fecha_pago" TIMESTAMP(3),
    "comprobante" TEXT,
    "ncf_proveedor" TEXT,
    "notas" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ordenes_compra_empresa_id_estado_idx" ON "ordenes_compra"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "ordenes_compra_empresa_id_proveedor_id_idx" ON "ordenes_compra"("empresa_id", "proveedor_id");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_empresa_id_numero_key" ON "ordenes_compra"("empresa_id", "numero");

-- CreateIndex
CREATE INDEX "items_orden_compra_orden_compra_id_idx" ON "items_orden_compra"("orden_compra_id");

-- CreateIndex
CREATE INDEX "gastos_empresa_id_estado_idx" ON "gastos"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "gastos_empresa_id_fecha_gasto_idx" ON "gastos"("empresa_id", "fecha_gasto");

-- CreateIndex
CREATE INDEX "asientos_contables_orden_compra_id_idx" ON "asientos_contables"("orden_compra_id");

-- CreateIndex
CREATE INDEX "asientos_contables_gasto_id_idx" ON "asientos_contables"("gasto_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_orden_compra_id_idx" ON "movimientos_inventario"("orden_compra_id");

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
