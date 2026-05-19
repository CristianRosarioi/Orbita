-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('BORRADOR', 'ENVIADO', 'CONFIRMADO', 'RECIBIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "numero_lote" TEXT NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "cantidad_inicial" DECIMAL(65,30) NOT NULL,
    "cantidad_actual" DECIMAL(65,30) NOT NULL,
    "precio_compra" DECIMAL(65,30),
    "proveedor" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_proveedor" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'BORRADOR',
    "notas" TEXT,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fecha_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega" TIMESTAMP(3),
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pedidos_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_pedido_proveedor" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "producto_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "unidad_medida" TEXT NOT NULL DEFAULT 'und',
    "cantidad" DECIMAL(65,30) NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pedido_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lotes_empresa_id_fecha_vencimiento_idx" ON "lotes"("empresa_id", "fecha_vencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_empresa_id_producto_id_numero_lote_key" ON "lotes"("empresa_id", "producto_id", "numero_lote");

-- CreateIndex
CREATE INDEX "pedidos_proveedor_empresa_id_estado_idx" ON "pedidos_proveedor"("empresa_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_proveedor_empresa_id_numero_key" ON "pedidos_proveedor"("empresa_id", "numero");

-- CreateIndex
CREATE INDEX "items_pedido_proveedor_pedido_id_idx" ON "items_pedido_proveedor"("pedido_id");

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_proveedor" ADD CONSTRAINT "pedidos_proveedor_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_proveedor" ADD CONSTRAINT "pedidos_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido_proveedor" ADD CONSTRAINT "items_pedido_proveedor_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos_proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido_proveedor" ADD CONSTRAINT "items_pedido_proveedor_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
