-- CreateEnum
CREATE TYPE "estado_caja" AS ENUM ('ABIERTA', 'CERRADA');

-- AlterTable
ALTER TABLE "facturas" ADD COLUMN     "sesion_caja_id" TEXT;

-- CreateTable
CREATE TABLE "sesiones_caja" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT,
    "usuario_id" TEXT NOT NULL,
    "estado" "estado_caja" NOT NULL DEFAULT 'ABIERTA',
    "monto_apertura" DECIMAL(65,30) NOT NULL,
    "monto_cierre_declarado" DECIMAL(65,30),
    "monto_cierre_real" DECIMAL(65,30),
    "diferencia" DECIMAL(65,30),
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesiones_caja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sesiones_caja_empresa_id_estado_idx" ON "sesiones_caja"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "sesiones_caja_empresa_id_fecha_apertura_idx" ON "sesiones_caja"("empresa_id", "fecha_apertura");

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_sesion_caja_id_fkey" FOREIGN KEY ("sesion_caja_id") REFERENCES "sesiones_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
