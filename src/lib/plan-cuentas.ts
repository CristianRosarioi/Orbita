import type { TipoCuenta as TipoCuentaEnum } from '@/generated/prisma/client';

interface CuentaBase {
  codigo: string;
  nombre: string;
  tipo: TipoCuentaEnum;
  padre: string | null;
}

export function getPlanCuentasBase(): CuentaBase[] {
  return [
    // ---- ACTIVOS ----
    { codigo: '1000', nombre: 'Activo', tipo: 'ACTIVO', padre: null },
    { codigo: '1100', nombre: 'Activo Corriente', tipo: 'ACTIVO', padre: '1000' },
    { codigo: '1101', nombre: 'Caja', tipo: 'ACTIVO', padre: '1100' },
    { codigo: '1102', nombre: 'Banco', tipo: 'ACTIVO', padre: '1100' },
    { codigo: '1103', nombre: 'Cuentas por Cobrar Clientes', tipo: 'ACTIVO', padre: '1100' },
    { codigo: '1104', nombre: 'ITBIS por Cobrar', tipo: 'ACTIVO', padre: '1100' },
    { codigo: '1105', nombre: 'Inventario', tipo: 'ACTIVO', padre: '1100' },
    { codigo: '1200', nombre: 'Activo No Corriente', tipo: 'ACTIVO', padre: '1000' },
    { codigo: '1201', nombre: 'Equipos y Mobiliario', tipo: 'ACTIVO', padre: '1200' },
    { codigo: '1202', nombre: 'Depreciación Acumulada', tipo: 'ACTIVO', padre: '1200' },

    // ---- PASIVOS ----
    { codigo: '2000', nombre: 'Pasivo', tipo: 'PASIVO', padre: null },
    { codigo: '2100', nombre: 'Pasivo Corriente', tipo: 'PASIVO', padre: '2000' },
    { codigo: '2101', nombre: 'Cuentas por Pagar Proveedores', tipo: 'PASIVO', padre: '2100' },
    { codigo: '2102', nombre: 'ITBIS por Pagar', tipo: 'PASIVO', padre: '2100' },
    { codigo: '2103', nombre: 'Retenciones por Pagar', tipo: 'PASIVO', padre: '2100' },
    { codigo: '2200', nombre: 'Pasivo No Corriente', tipo: 'PASIVO', padre: '2000' },

    // ---- PATRIMONIO ----
    { codigo: '3000', nombre: 'Patrimonio', tipo: 'PATRIMONIO', padre: null },
    { codigo: '3001', nombre: 'Capital Social', tipo: 'PATRIMONIO', padre: '3000' },
    { codigo: '3002', nombre: 'Utilidades Retenidas', tipo: 'PATRIMONIO', padre: '3000' },

    // ---- INGRESOS ----
    { codigo: '4000', nombre: 'Ingresos', tipo: 'INGRESO', padre: null },
    { codigo: '4001', nombre: 'Ventas de Bienes', tipo: 'INGRESO', padre: '4000' },
    { codigo: '4002', nombre: 'Ventas de Servicios', tipo: 'INGRESO', padre: '4000' },
    { codigo: '4003', nombre: 'Descuentos en Ventas', tipo: 'INGRESO', padre: '4000' },

    // ---- GASTOS ----
    { codigo: '5000', nombre: 'Gastos', tipo: 'GASTO', padre: null },
    { codigo: '5001', nombre: 'Costo de Ventas', tipo: 'GASTO', padre: '5000' },
    { codigo: '5002', nombre: 'Gastos Operacionales', tipo: 'GASTO', padre: '5000' },
    { codigo: '5003', nombre: 'Gastos de Administración', tipo: 'GASTO', padre: '5000' },
  ];
}
