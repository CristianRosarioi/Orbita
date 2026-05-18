-- CreateEnum
CREATE TYPE "tipo_contrato" AS ENUM ('INDEFINIDO', 'DETERMINADO', 'POR_OBRA', 'TEMPORAL');

-- CreateEnum
CREATE TYPE "estado_empleado" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'TERMINADO');

-- CreateEnum
CREATE TYPE "frecuencia_pago" AS ENUM ('SEMANAL', 'QUINCENAL', 'MENSUAL');

-- CreateEnum
CREATE TYPE "estado_nomina" AS ENUM ('BORRADOR', 'PROCESADA', 'PAGADA', 'ANULADA');

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "departamento" TEXT,
    "salario_base" DECIMAL(65,30) NOT NULL,
    "tipo_contrato" "tipo_contrato" NOT NULL,
    "frecuencia_pago" "frecuencia_pago" NOT NULL,
    "estado" "estado_empleado" NOT NULL DEFAULT 'ACTIVO',
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "fecha_salida" TIMESTAMP(3),
    "email" TEXT,
    "telefono" TEXT,
    "numero_cuenta" TEXT,
    "banco" TEXT,
    "notas" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "estado" "estado_nomina" NOT NULL DEFAULT 'BORRADOR',
    "total_bruto" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_tss" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_isr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_otros" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_neto" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "creado_por" TEXT NOT NULL,
    "procesada_en" TIMESTAMP(3),
    "pagada_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nominas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_nomina" (
    "id" TEXT NOT NULL,
    "nomina_id" TEXT NOT NULL,
    "empleado_id" TEXT NOT NULL,
    "salario_base" DECIMAL(65,30) NOT NULL,
    "dias_trabajados" DECIMAL(65,30) NOT NULL DEFAULT 23.83,
    "salario_bruto" DECIMAL(65,30) NOT NULL,
    "tss_trabajador" DECIMAL(65,30) NOT NULL,
    "tss_empleador" DECIMAL(65,30) NOT NULL,
    "isr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otros_descuentos" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otros_ingresos" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "salario_neto" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_nomina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "empleados_empresa_id_estado_idx" ON "empleados"("empresa_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_empresa_id_cedula_key" ON "empleados"("empresa_id", "cedula");

-- CreateIndex
CREATE INDEX "nominas_empresa_id_estado_idx" ON "nominas"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "nominas_empresa_id_periodo_idx" ON "nominas"("empresa_id", "periodo");

-- CreateIndex
CREATE INDEX "items_nomina_nomina_id_idx" ON "items_nomina"("nomina_id");

-- CreateIndex
CREATE INDEX "items_nomina_empleado_id_idx" ON "items_nomina"("empleado_id");

-- CreateIndex
CREATE UNIQUE INDEX "items_nomina_nomina_id_empleado_id_key" ON "items_nomina"("nomina_id", "empleado_id");

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominas" ADD CONSTRAINT "nominas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_nomina" ADD CONSTRAINT "items_nomina_nomina_id_fkey" FOREIGN KEY ("nomina_id") REFERENCES "nominas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_nomina" ADD CONSTRAINT "items_nomina_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
