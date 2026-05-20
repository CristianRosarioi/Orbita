-- CreateEnum
CREATE TYPE "tipo_notificacion" AS ENUM ('FACTURA_EMITIDA', 'FACTURA_VENCIDA', 'PAGO_RECIBIDO', 'CITA_RECORDATORIO', 'STOCK_BAJO', 'NOMINA_PROCESADA', 'BIENVENIDA');

-- CreateEnum
CREATE TYPE "canal_notificacion" AS ENUM ('WHATSAPP', 'EMAIL', 'AMBOS');

-- CreateEnum
CREATE TYPE "estado_notificacion" AS ENUM ('PENDIENTE', 'ENVIADA', 'FALLIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "config_notificacion" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "whatsapp_activo" BOOLEAN NOT NULL DEFAULT false,
    "email_activo" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_numero" TEXT,
    "whatsapp_api_key" TEXT,
    "email_remitente" TEXT,
    "notif_facturas" BOOLEAN NOT NULL DEFAULT true,
    "notif_vencimientos" BOOLEAN NOT NULL DEFAULT true,
    "notif_citas" BOOLEAN NOT NULL DEFAULT true,
    "notif_stock_bajo" BOOLEAN NOT NULL DEFAULT true,
    "notif_nomina" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "tipo" "tipo_notificacion" NOT NULL,
    "canal" "canal_notificacion" NOT NULL,
    "estado" "estado_notificacion" NOT NULL DEFAULT 'PENDIENTE',
    "destinatario" TEXT NOT NULL,
    "asunto" TEXT,
    "mensaje" TEXT NOT NULL,
    "referencia" TEXT,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "error_msg" TEXT,
    "enviada_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "config_notificacion_empresa_id_key" ON "config_notificacion"("empresa_id");

-- CreateIndex
CREATE INDEX "notificaciones_empresa_id_estado_idx" ON "notificaciones"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "notificaciones_empresa_id_tipo_idx" ON "notificaciones"("empresa_id", "tipo");

-- CreateIndex
CREATE INDEX "notificaciones_empresa_id_created_at_idx" ON "notificaciones"("empresa_id", "created_at");

-- AddForeignKey
ALTER TABLE "config_notificacion" ADD CONSTRAINT "config_notificacion_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
