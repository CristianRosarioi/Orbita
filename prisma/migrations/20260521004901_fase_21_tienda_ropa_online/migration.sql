-- CreateEnum
CREATE TYPE "EstadoDevolucion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'COMPLETADA');

-- CreateEnum
CREATE TYPE "EstadoPedidoOnline" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "variantes" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "talla" TEXT,
    "color" TEXT,
    "sku" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "precio" DECIMAL(65,30),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "motivo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'DEVOLUCION',
    "estado" "EstadoDevolucion" NOT NULL DEFAULT 'PENDIENTE',
    "monto_credito" DECIMAL(65,30),
    "notas" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_online" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "cliente_id" TEXT,
    "cliente_nombre" TEXT NOT NULL,
    "cliente_telefono" TEXT,
    "canal" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "estado" "EstadoPedidoOnline" NOT NULL DEFAULT 'PENDIENTE',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "itbis" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "metodo_pago" TEXT,
    "tracking" TEXT,
    "direccion_entrega" TEXT,
    "notas" TEXT,
    "factura_id" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pedidos_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_pedido_online" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "producto_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pedido_online_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variantes_empresa_id_producto_id_idx" ON "variantes"("empresa_id", "producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_empresa_id_producto_id_talla_color_key" ON "variantes"("empresa_id", "producto_id", "talla", "color");

-- CreateIndex
CREATE INDEX "devoluciones_empresa_id_estado_idx" ON "devoluciones"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "devoluciones_factura_id_idx" ON "devoluciones"("factura_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_online_factura_id_key" ON "pedidos_online"("factura_id");

-- CreateIndex
CREATE INDEX "pedidos_online_empresa_id_estado_idx" ON "pedidos_online"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "pedidos_online_empresa_id_created_at_idx" ON "pedidos_online"("empresa_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_online_empresa_id_numero_key" ON "pedidos_online"("empresa_id", "numero");

-- CreateIndex
CREATE INDEX "items_pedido_online_pedido_id_idx" ON "items_pedido_online"("pedido_id");

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_online" ADD CONSTRAINT "pedidos_online_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_online" ADD CONSTRAINT "pedidos_online_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido_online" ADD CONSTRAINT "items_pedido_online_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos_online"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido_online" ADD CONSTRAINT "items_pedido_online_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
