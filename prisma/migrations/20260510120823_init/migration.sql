-- CreateEnum
CREATE TYPE "industria" AS ENUM ('RESTAURANTE', 'COLMADO', 'CARWASH', 'REPUESTOS', 'TALLER_MECANICO', 'FERRETERIA', 'SALON_BARBERIA', 'CLINICA', 'INMOBILIARIA', 'FARMACIA', 'TIENDA_ROPA', 'TIENDA_ONLINE', 'JOYERIA', 'OTRO');

-- CreateEnum
CREATE TYPE "modo_fiscal" AS ENUM ('SIMPLE', 'FISCAL');

-- CreateEnum
CREATE TYPE "rol_empresa" AS ENUM ('OWNER', 'ADMIN', 'VENDEDOR', 'CONTADOR', 'CAJERO', 'VIEWER');

-- CreateEnum
CREATE TYPE "estado_suscripcion" AS ENUM ('TRIAL', 'ACTIVA', 'SUSPENDIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "plan_suscripcion" AS ENUM ('BASICO', 'PRO', 'EMPRESA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT,
    "apellido" TEXT,
    "avatar" TEXT,
    "telefono" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_comercial" TEXT,
    "rnc" TEXT,
    "industria" "industria" NOT NULL,
    "modo_fiscal" "modo_fiscal" NOT NULL DEFAULT 'SIMPLE',
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "logo_url" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "timezone" TEXT NOT NULL DEFAULT 'America/Santo_Domingo',
    "plan_suscripcion" "plan_suscripcion" NOT NULL DEFAULT 'BASICO',
    "estado_suscripcion" "estado_suscripcion" NOT NULL DEFAULT 'TRIAL',
    "trial_finaliza" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "miembros_empresa" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "rol" "rol_empresa" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "invitado_por" TEXT,
    "aceptado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "miembros_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_usuario_empresa" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "empresa_activa_id" TEXT NOT NULL,
    "sucursal_activa_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesiones_usuario_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_clerk_id_key" ON "usuarios"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_clerk_id_idx" ON "usuarios"("clerk_id");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_deleted_at_idx" ON "usuarios"("deleted_at");

-- CreateIndex
CREATE INDEX "empresas_rnc_idx" ON "empresas"("rnc");

-- CreateIndex
CREATE INDEX "empresas_deleted_at_idx" ON "empresas"("deleted_at");

-- CreateIndex
CREATE INDEX "miembros_empresa_empresa_id_idx" ON "miembros_empresa"("empresa_id");

-- CreateIndex
CREATE INDEX "miembros_empresa_usuario_id_idx" ON "miembros_empresa"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "miembros_empresa_usuario_id_empresa_id_key" ON "miembros_empresa"("usuario_id", "empresa_id");

-- CreateIndex
CREATE INDEX "sucursales_empresa_id_idx" ON "sucursales"("empresa_id");

-- CreateIndex
CREATE INDEX "sucursales_empresa_id_deleted_at_idx" ON "sucursales"("empresa_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_empresa_id_codigo_key" ON "sucursales"("empresa_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_usuario_empresa_usuario_id_key" ON "sesiones_usuario_empresa"("usuario_id");

-- CreateIndex
CREATE INDEX "sesiones_usuario_empresa_empresa_activa_id_idx" ON "sesiones_usuario_empresa"("empresa_activa_id");

-- AddForeignKey
ALTER TABLE "miembros_empresa" ADD CONSTRAINT "miembros_empresa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros_empresa" ADD CONSTRAINT "miembros_empresa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_usuario_empresa" ADD CONSTRAINT "sesiones_usuario_empresa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_usuario_empresa" ADD CONSTRAINT "sesiones_usuario_empresa_empresa_activa_id_fkey" FOREIGN KEY ("empresa_activa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_usuario_empresa" ADD CONSTRAINT "sesiones_usuario_empresa_sucursal_activa_id_fkey" FOREIGN KEY ("sucursal_activa_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
