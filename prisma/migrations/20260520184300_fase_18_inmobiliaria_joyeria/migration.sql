-- CreateEnum
CREATE TYPE "estado_propiedad" AS ENUM ('DISPONIBLE', 'ALQUILADA', 'EN_VENTA', 'VENDIDA', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "tipo_propiedad" AS ENUM ('APARTAMENTO', 'CASA', 'LOCAL_COMERCIAL', 'OFICINA', 'TERRENO', 'NAVE_INDUSTRIAL');

-- CreateEnum
CREATE TYPE "estado_contrato" AS ENUM ('ACTIVO', 'VENCIDO', 'CANCELADO', 'POR_VENCER');

-- CreateEnum
CREATE TYPE "estado_pieza" AS ENUM ('EN_VITRINA', 'VENDIDA', 'EN_REPARACION', 'RESERVADA', 'CONSIGNACION');

-- CreateEnum
CREATE TYPE "tipo_material" AS ENUM ('ORO_18K', 'ORO_14K', 'ORO_10K', 'PLATA_925', 'PLATINO', 'OTRO');

-- CreateTable
CREATE TABLE "propiedades" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "tipo_propiedad" NOT NULL,
    "estado" "estado_propiedad" NOT NULL DEFAULT 'DISPONIBLE',
    "direccion" TEXT NOT NULL,
    "sector" TEXT,
    "ciudad" TEXT NOT NULL DEFAULT 'Santo Domingo',
    "habitaciones" INTEGER,
    "banos" INTEGER,
    "metros_cuadrados" DECIMAL(65,30),
    "precio_alquiler" DECIMAL(65,30),
    "precio_venta" DECIMAL(65,30),
    "descripcion" TEXT,
    "notas" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "propiedades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos_alquiler" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "propiedad_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "inquilino_nombre" TEXT NOT NULL,
    "inquilino_telefono" TEXT,
    "inquilino_cedula" TEXT,
    "monto_mensual" DECIMAL(65,30) NOT NULL,
    "deposito" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "estado" "estado_contrato" NOT NULL DEFAULT 'ACTIVO',
    "notas" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_alquiler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_alquiler" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "pagado_en" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "factura_id" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_alquiler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "piezas_joya" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "material" "tipo_material" NOT NULL,
    "peso_gramos" DECIMAL(65,30),
    "quilates" DECIMAL(65,30),
    "estado" "estado_pieza" NOT NULL DEFAULT 'EN_VITRINA',
    "precio_compra" DECIMAL(65,30),
    "precio_venta" DECIMAL(65,30) NOT NULL,
    "descripcion" TEXT,
    "notas" TEXT,
    "cliente_id" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "piezas_joya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reparaciones_joya" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "pieza_id" TEXT,
    "cliente_id" TEXT,
    "cliente_nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "diagnostico" TEXT,
    "presupuesto" DECIMAL(65,30),
    "costo_final" DECIMAL(65,30),
    "estado" TEXT NOT NULL DEFAULT 'RECIBIDA',
    "fecha_promesa" TIMESTAMP(3),
    "fecha_entrega" TIMESTAMP(3),
    "factura_id" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reparaciones_joya_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "propiedades_empresa_id_estado_idx" ON "propiedades"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "propiedades_empresa_id_tipo_idx" ON "propiedades"("empresa_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "propiedades_empresa_id_codigo_key" ON "propiedades"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "contratos_alquiler_empresa_id_estado_idx" ON "contratos_alquiler"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "contratos_alquiler_propiedad_id_idx" ON "contratos_alquiler"("propiedad_id");

-- CreateIndex
CREATE INDEX "pagos_alquiler_empresa_id_estado_idx" ON "pagos_alquiler"("empresa_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_alquiler_contrato_id_mes_key" ON "pagos_alquiler"("contrato_id", "mes");

-- CreateIndex
CREATE INDEX "piezas_joya_empresa_id_estado_idx" ON "piezas_joya"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "piezas_joya_empresa_id_material_idx" ON "piezas_joya"("empresa_id", "material");

-- CreateIndex
CREATE UNIQUE INDEX "piezas_joya_empresa_id_codigo_key" ON "piezas_joya"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "reparaciones_joya_empresa_id_estado_idx" ON "reparaciones_joya"("empresa_id", "estado");

-- AddForeignKey
ALTER TABLE "propiedades" ADD CONSTRAINT "propiedades_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos_alquiler" ADD CONSTRAINT "contratos_alquiler_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos_alquiler" ADD CONSTRAINT "contratos_alquiler_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "propiedades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos_alquiler" ADD CONSTRAINT "contratos_alquiler_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_alquiler" ADD CONSTRAINT "pagos_alquiler_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos_alquiler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_alquiler" ADD CONSTRAINT "pagos_alquiler_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piezas_joya" ADD CONSTRAINT "piezas_joya_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piezas_joya" ADD CONSTRAINT "piezas_joya_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reparaciones_joya" ADD CONSTRAINT "reparaciones_joya_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reparaciones_joya" ADD CONSTRAINT "reparaciones_joya_pieza_id_fkey" FOREIGN KEY ("pieza_id") REFERENCES "piezas_joya"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reparaciones_joya" ADD CONSTRAINT "reparaciones_joya_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
