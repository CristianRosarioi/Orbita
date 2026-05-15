-- CreateEnum
CREATE TYPE "estado_factura" AS ENUM ('BORRADOR', 'EMITIDA', 'PAGADA', 'ANULADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "metodo_pago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO');

-- CreateEnum
CREATE TYPE "tipo_movimiento_inventario" AS ENUM ('VENTA', 'DEVOLUCION', 'AJUSTE_ENTRADA', 'AJUSTE_SALIDA', 'COMPRA');

-- CreateTable
CREATE TABLE "secuencias_factura" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "prefijo" TEXT NOT NULL DEFAULT 'FAC',
    "anio" INTEGER NOT NULL,
    "ultimo_numero" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secuencias_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT,
    "numero" TEXT NOT NULL,
    "numero_int" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "cliente_id" TEXT,
    "cliente_nombre" TEXT NOT NULL,
    "cliente_identificacion" TEXT,
    "estado" "estado_factura" NOT NULL DEFAULT 'BORRADOR',
    "metodo_pago" "metodo_pago" NOT NULL DEFAULT 'EFECTIVO',
    "subtotal" DECIMAL(65,30) NOT NULL,
    "itbis" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "total_pagado" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "saldo" DECIMAL(65,30) NOT NULL,
    "notas" TEXT,
    "fecha_vencimiento" TIMESTAMP(3),
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT NOT NULL,
    "anulado_por" TEXT,
    "motivo_anulacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_factura" (
    "id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "producto_id" TEXT,
    "producto_nombre" TEXT NOT NULL,
    "producto_sku" TEXT,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "itbis_porcentaje" DECIMAL(65,30) NOT NULL DEFAULT 18,
    "itbis_monto" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_factura" (
    "id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "metodo_pago" "metodo_pago" NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registrado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "factura_id" TEXT,
    "tipo" "tipo_movimiento_inventario" NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "stock_antes" DECIMAL(65,30) NOT NULL,
    "stock_despues" DECIMAL(65,30) NOT NULL,
    "notas" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "secuencias_factura_empresa_id_idx" ON "secuencias_factura"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "secuencias_factura_empresa_id_anio_key" ON "secuencias_factura"("empresa_id", "anio");

-- CreateIndex
CREATE INDEX "facturas_empresa_id_estado_idx" ON "facturas"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "facturas_empresa_id_cliente_id_idx" ON "facturas"("empresa_id", "cliente_id");

-- CreateIndex
CREATE INDEX "facturas_empresa_id_fecha_emision_idx" ON "facturas"("empresa_id", "fecha_emision");

-- CreateIndex
CREATE INDEX "facturas_empresa_id_numero_int_idx" ON "facturas"("empresa_id", "numero_int");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_empresa_id_numero_key" ON "facturas"("empresa_id", "numero");

-- CreateIndex
CREATE INDEX "items_factura_factura_id_idx" ON "items_factura"("factura_id");

-- CreateIndex
CREATE INDEX "items_factura_producto_id_idx" ON "items_factura"("producto_id");

-- CreateIndex
CREATE INDEX "pagos_factura_factura_id_idx" ON "pagos_factura"("factura_id");

-- CreateIndex
CREATE INDEX "pagos_factura_empresa_id_fecha_pago_idx" ON "pagos_factura"("empresa_id", "fecha_pago");

-- CreateIndex
CREATE INDEX "movimientos_inventario_empresa_id_producto_id_idx" ON "movimientos_inventario"("empresa_id", "producto_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_factura_id_idx" ON "movimientos_inventario"("factura_id");

-- AddForeignKey
ALTER TABLE "secuencias_factura" ADD CONSTRAINT "secuencias_factura_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_factura" ADD CONSTRAINT "items_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_factura" ADD CONSTRAINT "items_factura_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_factura" ADD CONSTRAINT "pagos_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_factura" ADD CONSTRAINT "pagos_factura_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
