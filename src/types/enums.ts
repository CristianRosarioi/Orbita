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
