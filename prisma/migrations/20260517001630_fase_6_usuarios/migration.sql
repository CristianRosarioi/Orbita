-- CreateEnum
CREATE TYPE "estado_invitacion" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA');

-- CreateTable
CREATE TABLE "invitaciones" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" "rol_empresa" NOT NULL,
    "token" TEXT NOT NULL,
    "estado" "estado_invitacion" NOT NULL DEFAULT 'PENDIENTE',
    "invitado_por" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "aceptado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_token_key" ON "invitaciones"("token");

-- CreateIndex
CREATE INDEX "invitaciones_empresa_id_idx" ON "invitaciones"("empresa_id");

-- CreateIndex
CREATE INDEX "invitaciones_token_idx" ON "invitaciones"("token");

-- CreateIndex
CREATE INDEX "invitaciones_email_idx" ON "invitaciones"("email");

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
