-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "industria" ADD VALUE 'COLMADO_GRANDE';
ALTER TYPE "industria" ADD VALUE 'SUPERMERCADO';
ALTER TYPE "industria" ADD VALUE 'MINIMARKET';

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_super" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "departamento_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_super_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ofertas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "categoria_id" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio_original" DECIMAL(65,30) NOT NULL,
    "precio_oferta" DECIMAL(65,30) NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ofertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precios_volumen" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad_min" DECIMAL(65,30) NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "etiqueta" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "precios_volumen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "departamentos_empresa_id_idx" ON "departamentos"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_empresa_id_nombre_key" ON "departamentos"("empresa_id", "nombre");

-- CreateIndex
CREATE INDEX "categorias_super_empresa_id_departamento_id_idx" ON "categorias_super"("empresa_id", "departamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_super_empresa_id_departamento_id_nombre_key" ON "categorias_super"("empresa_id", "departamento_id", "nombre");

-- CreateIndex
CREATE INDEX "ofertas_empresa_id_activa_idx" ON "ofertas"("empresa_id", "activa");

-- CreateIndex
CREATE INDEX "ofertas_empresa_id_fecha_fin_idx" ON "ofertas"("empresa_id", "fecha_fin");

-- CreateIndex
CREATE INDEX "precios_volumen_empresa_id_producto_id_idx" ON "precios_volumen"("empresa_id", "producto_id");

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_super" ADD CONSTRAINT "categorias_super_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_super" ADD CONSTRAINT "categorias_super_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_super"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precios_volumen" ADD CONSTRAINT "precios_volumen_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precios_volumen" ADD CONSTRAINT "precios_volumen_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
