-- CreateEnum
CREATE TYPE "estado_orden_trabajo" AS ENUM ('RECIBIDO', 'EN_DIAGNOSTICO', 'ESPERANDO_REPUESTOS', 'EN_REPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "estado_cita" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA', 'NO_SHOW');

-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "cliente_id" TEXT,
    "cliente_nombre" TEXT NOT NULL,
    "cliente_telefono" TEXT,
    "vehiculo_marca" TEXT NOT NULL,
    "vehiculo_modelo" TEXT NOT NULL,
    "vehiculo_anio" INTEGER,
    "vehiculo_placa" TEXT NOT NULL,
    "vehiculo_color" TEXT,
    "kilometraje" INTEGER,
    "estado" "estado_orden_trabajo" NOT NULL DEFAULT 'RECIBIDO',
    "descripcion_falla" TEXT NOT NULL,
    "diagnostico" TEXT,
    "trabajo_realizado" TEXT,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "itbis" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "factura_id" TEXT,
    "tecnico" TEXT,
    "fecha_recepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_promesa" TIMESTAMP(3),
    "fecha_entrega" TIMESTAMP(3),
    "notas" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_orden_trabajo" (
    "id" TEXT NOT NULL,
    "orden_trabajo_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "producto_id" TEXT,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "itbis_porcentaje" DECIMAL(65,30) NOT NULL DEFAULT 18,
    "itbis_monto" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_orden_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "cliente_nombre" TEXT NOT NULL,
    "cliente_telefono" TEXT,
    "empleado_id" TEXT,
    "servicio" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "duracion_min" INTEGER NOT NULL DEFAULT 60,
    "precio" DECIMAL(65,30) NOT NULL,
    "estado" "estado_cita" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "factura_id" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ordenes_trabajo_empresa_id_estado_idx" ON "ordenes_trabajo"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_empresa_id_vehiculo_placa_idx" ON "ordenes_trabajo"("empresa_id", "vehiculo_placa");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_empresa_id_numero_key" ON "ordenes_trabajo"("empresa_id", "numero");

-- CreateIndex
CREATE INDEX "items_orden_trabajo_orden_trabajo_id_idx" ON "items_orden_trabajo"("orden_trabajo_id");

-- CreateIndex
CREATE INDEX "citas_empresa_id_fecha_idx" ON "citas"("empresa_id", "fecha");

-- CreateIndex
CREATE INDEX "citas_empresa_id_estado_idx" ON "citas"("empresa_id", "estado");

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_trabajo" ADD CONSTRAINT "items_orden_trabajo_orden_trabajo_id_fkey" FOREIGN KEY ("orden_trabajo_id") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_trabajo" ADD CONSTRAINT "items_orden_trabajo_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
