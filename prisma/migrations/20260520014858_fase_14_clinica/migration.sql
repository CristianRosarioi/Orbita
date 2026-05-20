-- CreateEnum
CREATE TYPE "estado_expediente" AS ENUM ('ACTIVO', 'INACTIVO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "estado_consulta" AS ENUM ('PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO');

-- CreateEnum
CREATE TYPE "tipo_sangre" AS ENUM ('A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO', 'AB_POSITIVO', 'AB_NEGATIVO', 'O_POSITIVO', 'O_NEGATIVO', 'DESCONOCIDO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "industria" ADD VALUE 'DENTAL';
ALTER TYPE "industria" ADD VALUE 'VETERINARIA';

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "numero_expediente" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3),
    "sexo" TEXT,
    "cedula" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "tipo_sangre" "tipo_sangre",
    "alergias" TEXT,
    "antecedentes" TEXT,
    "estado" "estado_expediente" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "medico_nombre" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "receta" TEXT,
    "peso" DECIMAL(65,30),
    "talla" DECIMAL(65,30),
    "temperatura" DECIMAL(65,30),
    "frecuencia_card" DECIMAL(65,30),
    "presion_arterial" TEXT,
    "notas" TEXT,
    "estado" "estado_consulta" NOT NULL DEFAULT 'PROGRAMADA',
    "precio" DECIMAL(65,30),
    "factura_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_cliente_id_key" ON "pacientes"("cliente_id");

-- CreateIndex
CREATE INDEX "pacientes_empresa_id_estado_idx" ON "pacientes"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "pacientes_empresa_id_nombre_idx" ON "pacientes"("empresa_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_empresa_id_numero_expediente_key" ON "pacientes"("empresa_id", "numero_expediente");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_empresa_id_cedula_key" ON "pacientes"("empresa_id", "cedula");

-- CreateIndex
CREATE UNIQUE INDEX "consultas_factura_id_key" ON "consultas"("factura_id");

-- CreateIndex
CREATE INDEX "consultas_empresa_id_fecha_hora_idx" ON "consultas"("empresa_id", "fecha_hora");

-- CreateIndex
CREATE INDEX "consultas_paciente_id_idx" ON "consultas"("paciente_id");

-- CreateIndex
CREATE INDEX "consultas_empresa_id_estado_idx" ON "consultas"("empresa_id", "estado");

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
