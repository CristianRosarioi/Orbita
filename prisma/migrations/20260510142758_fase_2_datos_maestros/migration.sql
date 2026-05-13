-- CreateEnum
CREATE TYPE "tipo_producto" AS ENUM ('BIEN', 'SERVICIO');

-- CreateEnum
CREATE TYPE "tipo_cliente" AS ENUM ('PERSONA', 'EMPRESA');

-- CreateEnum
CREATE TYPE "tipo_identificacion" AS ENUM ('CEDULA', 'RNC', 'PASAPORTE', 'SIN_IDENTIFICACION');

-- CreateEnum
CREATE TYPE "nivel_precio" AS ENUM ('CONTADO', 'CREDITO', 'MAYORISTA', 'ESPECIAL');

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT,
    "icono" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_medida" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "abreviatura" TEXT NOT NULL,
    "es_base" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "tipo" "tipo_cliente" NOT NULL,
    "tipo_identificacion" "tipo_identificacion" NOT NULL DEFAULT 'SIN_IDENTIFICACION',
    "identificacion" TEXT,
    "nombre" TEXT NOT NULL,
    "nombre_comercial" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "celular" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "provincia" TEXT,
    "notas" TEXT,
    "limite_credito" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dias_credito" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "tipo_identificacion" "tipo_identificacion" NOT NULL DEFAULT 'RNC',
    "identificacion" TEXT,
    "nombre" TEXT NOT NULL,
    "nombre_comercial" TEXT,
    "contacto" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "celular" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "provincia" TEXT,
    "notas" TEXT,
    "dias_credito" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "tipo" "tipo_producto" NOT NULL DEFAULT 'BIEN',
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "sku" TEXT,
    "codigo_barras" TEXT,
    "categoria_id" TEXT,
    "unidad_medida_id" TEXT NOT NULL,
    "precio_venta" DECIMAL(65,30) NOT NULL,
    "precio_compra" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "itbis_aplicable" BOOLEAN NOT NULL DEFAULT true,
    "itbis_incluido_en_precio" BOOLEAN NOT NULL DEFAULT false,
    "stock_actual" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "stock_minimo" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "imagen_url" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precios_producto" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "nivel" "nivel_precio" NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "precios_producto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categorias_empresa_id_deleted_at_idx" ON "categorias"("empresa_id", "deleted_at");

-- CreateIndex
CREATE INDEX "unidades_medida_empresa_id_deleted_at_idx" ON "unidades_medida"("empresa_id", "deleted_at");

-- CreateIndex
CREATE INDEX "clientes_empresa_id_deleted_at_idx" ON "clientes"("empresa_id", "deleted_at");

-- CreateIndex
CREATE INDEX "clientes_empresa_id_identificacion_idx" ON "clientes"("empresa_id", "identificacion");

-- CreateIndex
CREATE INDEX "clientes_empresa_id_nombre_idx" ON "clientes"("empresa_id", "nombre");

-- CreateIndex
CREATE INDEX "proveedores_empresa_id_deleted_at_idx" ON "proveedores"("empresa_id", "deleted_at");

-- CreateIndex
CREATE INDEX "proveedores_empresa_id_identificacion_idx" ON "proveedores"("empresa_id", "identificacion");

-- CreateIndex
CREATE INDEX "productos_empresa_id_deleted_at_idx" ON "productos"("empresa_id", "deleted_at");

-- CreateIndex
CREATE INDEX "productos_empresa_id_sku_idx" ON "productos"("empresa_id", "sku");

-- CreateIndex
CREATE INDEX "productos_empresa_id_codigo_barras_idx" ON "productos"("empresa_id", "codigo_barras");

-- CreateIndex
CREATE INDEX "productos_empresa_id_nombre_idx" ON "productos"("empresa_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "precios_producto_producto_id_nivel_key" ON "precios_producto"("producto_id", "nivel");

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_medida" ADD CONSTRAINT "unidades_medida_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_unidad_medida_id_fkey" FOREIGN KEY ("unidad_medida_id") REFERENCES "unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precios_producto" ADD CONSTRAINT "precios_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
