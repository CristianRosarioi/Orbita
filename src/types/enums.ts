// Enums del dominio de Órbita — valores idénticos a los del schema de Prisma.
// Este archivo se puede importar en Client Components (sin dependencia de Node.js).

export const Industria = {
  RESTAURANTE: 'RESTAURANTE',
  COLMADO: 'COLMADO',
  CARWASH: 'CARWASH',
  REPUESTOS: 'REPUESTOS',
  TALLER_MECANICO: 'TALLER_MECANICO',
  FERRETERIA: 'FERRETERIA',
  SALON_BARBERIA: 'SALON_BARBERIA',
  CLINICA: 'CLINICA',
  INMOBILIARIA: 'INMOBILIARIA',
  FARMACIA: 'FARMACIA',
  TIENDA_ROPA: 'TIENDA_ROPA',
  TIENDA_ONLINE: 'TIENDA_ONLINE',
  JOYERIA: 'JOYERIA',
  OTRO: 'OTRO',
} as const;
export type Industria = (typeof Industria)[keyof typeof Industria];

export const ModoFiscal = {
  SIMPLE: 'SIMPLE',
  FISCAL: 'FISCAL',
} as const;
export type ModoFiscal = (typeof ModoFiscal)[keyof typeof ModoFiscal];

export const RolEmpresa = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  VENDEDOR: 'VENDEDOR',
  CONTADOR: 'CONTADOR',
  CAJERO: 'CAJERO',
  VIEWER: 'VIEWER',
} as const;
export type RolEmpresa = (typeof RolEmpresa)[keyof typeof RolEmpresa];

export const EstadoSuscripcion = {
  TRIAL: 'TRIAL',
  ACTIVA: 'ACTIVA',
  SUSPENDIDA: 'SUSPENDIDA',
  CANCELADA: 'CANCELADA',
} as const;
export type EstadoSuscripcion = (typeof EstadoSuscripcion)[keyof typeof EstadoSuscripcion];

export const PlanSuscripcion = {
  BASICO: 'BASICO',
  PRO: 'PRO',
  EMPRESA: 'EMPRESA',
} as const;
export type PlanSuscripcion = (typeof PlanSuscripcion)[keyof typeof PlanSuscripcion];

export const TipoProducto = {
  BIEN: 'BIEN',
  SERVICIO: 'SERVICIO',
} as const;
export type TipoProducto = (typeof TipoProducto)[keyof typeof TipoProducto];

export const TipoCliente = {
  PERSONA: 'PERSONA',
  EMPRESA: 'EMPRESA',
} as const;
export type TipoCliente = (typeof TipoCliente)[keyof typeof TipoCliente];

export const TipoIdentificacion = {
  CEDULA: 'CEDULA',
  RNC: 'RNC',
  PASAPORTE: 'PASAPORTE',
  SIN_IDENTIFICACION: 'SIN_IDENTIFICACION',
} as const;
export type TipoIdentificacion = (typeof TipoIdentificacion)[keyof typeof TipoIdentificacion];

export const NivelPrecio = {
  CONTADO: 'CONTADO',
  CREDITO: 'CREDITO',
  MAYORISTA: 'MAYORISTA',
  ESPECIAL: 'ESPECIAL',
} as const;
export type NivelPrecio = (typeof NivelPrecio)[keyof typeof NivelPrecio];

export const EstadoFactura = {
  BORRADOR: 'BORRADOR',
  EMITIDA: 'EMITIDA',
  PAGADA: 'PAGADA',
  ANULADA: 'ANULADA',
  VENCIDA: 'VENCIDA',
} as const;
export type EstadoFactura = (typeof EstadoFactura)[keyof typeof EstadoFactura];

export const MetodoPago = {
  EFECTIVO: 'EFECTIVO',
  TARJETA: 'TARJETA',
  TRANSFERENCIA: 'TRANSFERENCIA',
  CHEQUE: 'CHEQUE',
  CREDITO: 'CREDITO',
} as const;
export type MetodoPago = (typeof MetodoPago)[keyof typeof MetodoPago];

export const TipoMovimientoInventario = {
  VENTA: 'VENTA',
  DEVOLUCION: 'DEVOLUCION',
  AJUSTE_ENTRADA: 'AJUSTE_ENTRADA',
  AJUSTE_SALIDA: 'AJUSTE_SALIDA',
  COMPRA: 'COMPRA',
} as const;
export type TipoMovimientoInventario =
  (typeof TipoMovimientoInventario)[keyof typeof TipoMovimientoInventario];

export const EstadoCaja = {
  ABIERTA: 'ABIERTA',
  CERRADA: 'CERRADA',
} as const;
export type EstadoCaja = (typeof EstadoCaja)[keyof typeof EstadoCaja];

export const TipoCuenta = {
  ACTIVO: 'ACTIVO',
  PASIVO: 'PASIVO',
  PATRIMONIO: 'PATRIMONIO',
  INGRESO: 'INGRESO',
  GASTO: 'GASTO',
} as const;
export type TipoCuenta = (typeof TipoCuenta)[keyof typeof TipoCuenta];

export const TipoAsiento = {
  DEBITO: 'DEBITO',
  CREDITO: 'CREDITO',
} as const;
export type TipoAsiento = (typeof TipoAsiento)[keyof typeof TipoAsiento];

export const EstadoInvitacion = {
  PENDIENTE: 'PENDIENTE',
  ACEPTADA: 'ACEPTADA',
  RECHAZADA: 'RECHAZADA',
  EXPIRADA: 'EXPIRADA',
} as const;
export type EstadoInvitacion = (typeof EstadoInvitacion)[keyof typeof EstadoInvitacion];

// Fase 7 — Verticales

export const EstadoMesa = {
  DISPONIBLE: 'DISPONIBLE',
  OCUPADA: 'OCUPADA',
  RESERVADA: 'RESERVADA',
  INACTIVA: 'INACTIVA',
} as const;
export type EstadoMesa = (typeof EstadoMesa)[keyof typeof EstadoMesa];

export const EstadoComanda = {
  ABIERTA: 'ABIERTA',
  LISTA: 'LISTA',
  SERVIDA: 'SERVIDA',
  CANCELADA: 'CANCELADA',
} as const;
export type EstadoComanda = (typeof EstadoComanda)[keyof typeof EstadoComanda];

export const EstadoItemComanda = {
  PENDIENTE: 'PENDIENTE',
  EN_PREPARACION: 'EN_PREPARACION',
  LISTO: 'LISTO',
  CANCELADO: 'CANCELADO',
} as const;
export type EstadoItemComanda = (typeof EstadoItemComanda)[keyof typeof EstadoItemComanda];

export const EstadoFiado = {
  PENDIENTE: 'PENDIENTE',
  PAGADO_PARCIAL: 'PAGADO_PARCIAL',
  PAGADO: 'PAGADO',
  VENCIDO: 'VENCIDO',
} as const;
export type EstadoFiado = (typeof EstadoFiado)[keyof typeof EstadoFiado];

export const TipoMovimientoFiado = {
  CARGO: 'CARGO',
  ABONO: 'ABONO',
} as const;
export type TipoMovimientoFiado = (typeof TipoMovimientoFiado)[keyof typeof TipoMovimientoFiado];

// Fase 8 — Compras y Gastos

export const EstadoOrdenCompra = {
  BORRADOR: 'BORRADOR',
  ENVIADA: 'ENVIADA',
  RECIBIDA_PARCIAL: 'RECIBIDA_PARCIAL',
  RECIBIDA: 'RECIBIDA',
  CANCELADA: 'CANCELADA',
} as const;
export type EstadoOrdenCompra = (typeof EstadoOrdenCompra)[keyof typeof EstadoOrdenCompra];

export const EstadoGasto = {
  PENDIENTE: 'PENDIENTE',
  PAGADO: 'PAGADO',
  VENCIDO: 'VENCIDO',
} as const;
export type EstadoGasto = (typeof EstadoGasto)[keyof typeof EstadoGasto];

export const CATEGORIAS_GASTO = [
  'ALQUILER',
  'SERVICIOS_PUBLICOS',
  'NOMINA',
  'MARKETING',
  'EQUIPOS',
  'TRANSPORTE',
  'COMUNICACIONES',
  'SEGUROS',
  'IMPUESTOS',
  'OTROS',
] as const;
export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

// Fase 9 — Nómina Dominicana

export const TipoContrato = {
  INDEFINIDO: 'INDEFINIDO',
  DETERMINADO: 'DETERMINADO',
  POR_OBRA: 'POR_OBRA',
  TEMPORAL: 'TEMPORAL',
} as const;
export type TipoContrato = (typeof TipoContrato)[keyof typeof TipoContrato];

export const EstadoEmpleado = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  SUSPENDIDO: 'SUSPENDIDO',
  TERMINADO: 'TERMINADO',
} as const;
export type EstadoEmpleado = (typeof EstadoEmpleado)[keyof typeof EstadoEmpleado];

export const FrecuenciaPago = {
  SEMANAL: 'SEMANAL',
  QUINCENAL: 'QUINCENAL',
  MENSUAL: 'MENSUAL',
} as const;
export type FrecuenciaPago = (typeof FrecuenciaPago)[keyof typeof FrecuenciaPago];

export const EstadoNomina = {
  BORRADOR: 'BORRADOR',
  PROCESADA: 'PROCESADA',
  PAGADA: 'PAGADA',
  ANULADA: 'ANULADA',
} as const;
export type EstadoNomina = (typeof EstadoNomina)[keyof typeof EstadoNomina];
