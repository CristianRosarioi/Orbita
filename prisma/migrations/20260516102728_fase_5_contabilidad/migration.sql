-- CreateEnum
CREATE TYPE "tipo_cuenta" AS ENUM ('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO');

-- CreateEnum
CREATE TYPE "tipo_asiento" AS ENUM ('DEBITO', 'CREDITO');

-- CreateTable
CREATE TABLE "cuentas_contables" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "tipo_cuenta" NOT NULL,
    "padre" TEXT,
    "es_base" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cuentas_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asientos_contables" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "factura_id" TEXT,
    "pago_id" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asientos_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_asiento" (
    "id" TEXT NOT NULL,
    "asiento_id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "tipo" "tipo_asiento" NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lineas_asiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cuentas_contables_empresa_id_tipo_idx" ON "cuentas_contables"("empresa_id", "tipo");

-- CreateIndex
CREATE INDEX "cuentas_contables_empresa_id_deleted_at_idx" ON "cuentas_contables"("empresa_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_contables_empresa_id_codigo_key" ON "cuentas_contables"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "asientos_contables_empresa_id_fecha_idx" ON "asientos_contables"("empresa_id", "fecha");

-- CreateIndex
CREATE INDEX "asientos_contables_factura_id_idx" ON "asientos_contables"("factura_id");

-- CreateIndex
CREATE INDEX "lineas_asiento_asiento_id_idx" ON "lineas_asiento"("asiento_id");

-- CreateIndex
CREATE INDEX "lineas_asiento_cuenta_id_idx" ON "lineas_asiento"("cuenta_id");

-- AddForeignKey
ALTER TABLE "cuentas_contables" ADD CONSTRAINT "cuentas_contables_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_contables" ADD CONSTRAINT "asientos_contables_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_asiento" ADD CONSTRAINT "lineas_asiento_asiento_id_fkey" FOREIGN KEY ("asiento_id") REFERENCES "asientos_contables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_asiento" ADD CONSTRAINT "lineas_asiento_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas_contables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
