import Dexie, { type Table } from 'dexie';

export interface ProductoLocal {
  id: string;
  nombre: string;
  precio: number;
  precioMayorista?: number;
  stock: number;
  sku?: string;
  categoria?: string;
  itbis: number;
  activo: boolean;
  empresaId: string;
  syncedAt: number;
}

export interface ClienteLocal {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  empresaId: string;
}

export interface ItemVentaOffline {
  productoId: string;
  nombre: string;
  cantidad: number;
  precio: number;
  itbis: number;
  subtotal: number;
  total: number;
}

export interface VentaOffline {
  id: string;
  empresaId: string;
  clienteId?: string;
  clienteNombre?: string;
  items: ItemVentaOffline[];
  subtotal: number;
  itbis: number;
  total: number;
  metodoPago: string;
  efectivoRecibido?: number;
  cambio?: number;
  estado: 'PENDIENTE_SYNC' | 'SINCRONIZADA' | 'ERROR_SYNC';
  errorMsg?: string;
  creadoEn: number;
  sincronizadoEn?: number;
}

export interface ConfigLocal {
  key: string;
  value: string;
}

class OrbitaDB extends Dexie {
  productos!: Table<ProductoLocal>;
  clientes!: Table<ClienteLocal>;
  ventasOffline!: Table<VentaOffline>;
  config!: Table<ConfigLocal>;

  constructor() {
    super('orbita-pos');
    this.version(1).stores({
      productos: 'id, empresaId, nombre, sku, activo',
      clientes: 'id, empresaId, nombre',
      ventasOffline: 'id, empresaId, estado, creadoEn',
      config: 'key',
    });
  }
}

// Solo instanciar en el cliente
export const db = typeof window !== 'undefined' ? new OrbitaDB() : (null as unknown as OrbitaDB);
