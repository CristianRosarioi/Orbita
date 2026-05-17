-- CreateEnum
CREATE TYPE "estado_mesa" AS ENUM ('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'INACTIVA');

-- CreateEnum
CREATE TYPE "estado_comanda" AS ENUM ('ABIERTA', 'LISTA', 'SERVIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "estado_item_comanda" AS ENUM ('PENDIENTE', 'EN_PREPARACION', 'LISTO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "estado_fiado" AS ENUM ('PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO', 'VENCIDO');

-- CreateTable
CREATE TABLE "mesas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT,
    "capacidad" INTEGER NOT NULL DEFAULT 4,
    "estado" "estado_mesa" NOT NULL DEFAULT 'DISPONIBLE',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comandas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "mesa_id" TEXT,
    "numero" INTEGER NOT NULL,
    "estado" "estado_comanda" NOT NULL DEFAULT 'ABIERTA',
    "mesero" TEXT,
    "personas" INTEGER NOT NULL DEFAULT 1,
    "notas" TEXT,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "itbis" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "propina" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "factura_id" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comandas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_comanda" (
    "id" TEXT NOT NULL,
    "comanda_id" TEXT NOT NULL,
    "producto_id" TEXT,
    "nombre" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "notas" TEXT,
    "estado" "estado_item_comanda" NOT NULL DEFAULT 'PENDIENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_comanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_fiado" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "limite" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "saldo" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estado" "estado_fiado" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_fiado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_fiado" (
    "id" TEXT NOT NULL,
    "cuenta_fiado_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "descripcion" TEXT,
    "factura_id" TEXT,
    "registrado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_fiado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mesas_empresa_id_estado_idx" ON "mesas"("empresa_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_empresa_id_numero_key" ON "mesas"("empresa_id", "numero");

-- CreateIndex
CREATE INDEX "comandas_empresa_id_estado_idx" ON "comandas"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "comandas_mesa_id_idx" ON "comandas"("mesa_id");

-- CreateIndex
CREATE UNIQUE INDEX "comandas_empresa_id_numero_key" ON "comandas"("empresa_id", "numero");

-- CreateIndex
CREATE INDEX "items_comanda_comanda_id_idx" ON "items_comanda"("comanda_id");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_fiado_cliente_id_key" ON "cuentas_fiado"("cliente_id");

-- CreateIndex
CREATE INDEX "cuentas_fiado_empresa_id_estado_idx" ON "cuentas_fiado"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "movimientos_fiado_cuenta_fiado_id_idx" ON "movimientos_fiado"("cuenta_fiado_id");

-- CreateIndex
CREATE INDEX "movimientos_fiado_empresa_id_idx" ON "movimientos_fiado"("empresa_id");

-- AddForeignKey
ALTER TABLE "mesas" ADD CONSTRAINT "mesas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_mesa_id_fkey" FOREIGN KEY ("mesa_id") REFERENCES "mesas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_comanda" ADD CONSTRAINT "items_comanda_comanda_id_fkey" FOREIGN KEY ("comanda_id") REFERENCES "comandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_comanda" ADD CONSTRAINT "items_comanda_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_fiado" ADD CONSTRAINT "cuentas_fiado_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_fiado" ADD CONSTRAINT "cuentas_fiado_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_fiado" ADD CONSTRAINT "movimientos_fiado_cuenta_fiado_id_fkey" FOREIGN KEY ("cuenta_fiado_id") REFERENCES "cuentas_fiado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_fiado" ADD CONSTRAINT "movimientos_fiado_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
