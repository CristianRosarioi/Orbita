-- CreateEnum
CREATE TYPE "estado_orden_carwash" AS ENUM ('EN_COLA', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "estado_cotizacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'FACTURADA');

-- CreateTable
CREATE TABLE "ordenes_carwash" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "cliente_id" TEXT,
    "cliente_nombre" TEXT NOT NULL,
    "cliente_telefono" TEXT,
    "vehiculo_placa" TEXT NOT NULL,
    "vehiculo_marca" TEXT,
    "vehiculo_modelo" TEXT,
    "vehiculo_color" TEXT,
    "tipo_servicio" TEXT NOT NULL,
    "duracion_min" INTEGER NOT NULL DEFAULT 30,
    "precio" DECIMAL(65,30) NOT NULL,
    "estado" "estado_orden_carwash" NOT NULL DEFAULT 'EN_COLA',
    "empleado_asignado" TEXT,
    "notas" TEXT,
    "factura_id" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ordenes_carwash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repuestos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "marca" TEXT,
    "marca_vehiculo" TEXT,
    "modelo_vehiculo" TEXT,
    "anio_desde" INTEGER,
    "anio_hasta" INTEGER,
    "precio" DECIMAL(65,30) NOT NULL,
    "precio_mayor" DECIMAL(65,30),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 2,
    "ubicacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "repuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizaciones" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "cliente_id" TEXT,
    "cliente_nombre" TEXT NOT NULL,
    "cliente_telefono" TEXT,
    "vehiculo_marca" TEXT,
    "vehiculo_modelo" TEXT,
    "vehiculo_anio" INTEGER,
    "vehiculo_placa" TEXT,
    "estado" "estado_cotizacion" NOT NULL DEFAULT 'PENDIENTE',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "itbis" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "valida_hasta" TIMESTAMP(3),
    "factura_id" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_cotizacion" (
    "id" TEXT NOT NULL,
    "cotizacion_id" TEXT NOT NULL,
    "repuesto_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "itbis_porcentaje" DECIMAL(65,30) NOT NULL DEFAULT 18,
    "itbis_monto" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_carwash_factura_id_key" ON "ordenes_carwash"("factura_id");

-- CreateIndex
CREATE INDEX "ordenes_carwash_empresa_id_estado_idx" ON "ordenes_carwash"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "ordenes_carwash_empresa_id_vehiculo_placa_idx" ON "ordenes_carwash"("empresa_id", "vehiculo_placa");

-- CreateIndex
CREATE INDEX "ordenes_carwash_empresa_id_created_at_idx" ON "ordenes_carwash"("empresa_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_carwash_empresa_id_numero_key" ON "ordenes_carwash"("empresa_id", "numero");

-- CreateIndex
CREATE INDEX "repuestos_empresa_id_marca_vehiculo_idx" ON "repuestos"("empresa_id", "marca_vehiculo");

-- CreateIndex
CREATE INDEX "repuestos_empresa_id_activo_idx" ON "repuestos"("empresa_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "repuestos_empresa_id_codigo_key" ON "repuestos"("empresa_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "cotizaciones_factura_id_key" ON "cotizaciones"("factura_id");

-- CreateIndex
CREATE INDEX "cotizaciones_empresa_id_estado_idx" ON "cotizaciones"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "cotizaciones_empresa_id_created_at_idx" ON "cotizaciones"("empresa_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "cotizaciones_empresa_id_numero_key" ON "cotizaciones"("empresa_id", "numero");

-- CreateIndex
CREATE INDEX "items_cotizacion_cotizacion_id_idx" ON "items_cotizacion"("cotizacion_id");

-- AddForeignKey
ALTER TABLE "ordenes_carwash" ADD CONSTRAINT "ordenes_carwash_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_carwash" ADD CONSTRAINT "ordenes_carwash_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repuestos" ADD CONSTRAINT "repuestos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_cotizacion" ADD CONSTRAINT "items_cotizacion_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_cotizacion" ADD CONSTRAINT "items_cotizacion_repuesto_id_fkey" FOREIGN KEY ("repuesto_id") REFERENCES "repuestos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
