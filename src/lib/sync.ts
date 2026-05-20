import { db } from '@/lib/db-local';
import type { ProductoLocal, ClienteLocal, VentaOffline } from '@/lib/db-local';

export interface SyncResult {
  productos: number;
  clientes: number;
  ventasOk: number;
  ventasErrores: number;
}

export async function sincronizarProductos(empresaId: string): Promise<number> {
  const res = await fetch('/api/productos?limit=500&activo=true');
  if (!res.ok) throw new Error('Error al descargar productos');
  const json = await res.json();
  const items: ProductoLocal[] = (json.data ?? []).map(
    (p: {
      id: string;
      nombre: string;
      precioVenta: number;
      stockActual: number;
      sku?: string;
      categoria?: { nombre: string };
      itbisAplicable?: boolean;
      activo?: boolean;
    }) => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precioVenta ?? 0,
      stock: p.stockActual ?? 0,
      sku: p.sku ?? undefined,
      categoria: p.categoria?.nombre ?? undefined,
      itbis: p.itbisAplicable ? 18 : 0,
      activo: p.activo ?? true,
      empresaId,
      syncedAt: Date.now(),
    }),
  );
  await db.productos.bulkPut(items);
  return items.length;
}

export async function sincronizarClientes(empresaId: string): Promise<number> {
  const res = await fetch('/api/clientes?limit=500');
  if (!res.ok) throw new Error('Error al descargar clientes');
  const json = await res.json();
  const items: ClienteLocal[] = (json.data ?? json.items ?? []).map(
    (c: { id: string; nombre: string; telefono?: string; email?: string }) => ({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono ?? undefined,
      email: c.email ?? undefined,
      empresaId,
    }),
  );
  await db.clientes.bulkPut(items);
  return items.length;
}

export interface ResultadoBulkSync {
  ok: number;
  errores: number;
}

export async function sincronizarVentasPendientes(): Promise<ResultadoBulkSync> {
  const pendientes = await db.ventasOffline.where('estado').equals('PENDIENTE_SYNC').toArray();

  if (pendientes.length === 0) return { ok: 0, errores: 0 };

  try {
    const res = await fetch('/api/pos/sync/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ventas: pendientes }),
    });

    if (!res.ok) {
      // Marcar todas como error
      await Promise.all(
        pendientes.map((v) =>
          db.ventasOffline.update(v.id, {
            estado: 'ERROR_SYNC',
            errorMsg: `HTTP ${res.status}`,
          }),
        ),
      );
      return { ok: 0, errores: pendientes.length };
    }

    const json: { ok: string[]; errores: { id: string; error: string }[] } = await res.json();
    const now = Date.now();

    const actualizaciones: Promise<unknown>[] = [];

    for (const id of json.ok) {
      actualizaciones.push(
        db.ventasOffline.update(id, { estado: 'SINCRONIZADA', sincronizadoEn: now }),
      );
    }

    for (const { id, error } of json.errores) {
      actualizaciones.push(db.ventasOffline.update(id, { estado: 'ERROR_SYNC', errorMsg: error }));
    }

    await Promise.all(actualizaciones);
    return { ok: json.ok.length, errores: json.errores.length };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Error de red';
    await Promise.all(
      pendientes.map((v) => db.ventasOffline.update(v.id, { estado: 'ERROR_SYNC', errorMsg })),
    );
    return { ok: 0, errores: pendientes.length };
  }
}

export async function sincronizarTodo(empresaId: string): Promise<SyncResult> {
  const [productos, clientes, ventas] = await Promise.all([
    sincronizarProductos(empresaId).catch(() => 0),
    sincronizarClientes(empresaId).catch(() => 0),
    sincronizarVentasPendientes().catch(() => ({ ok: 0, errores: 0 })),
  ]);
  return {
    productos,
    clientes,
    ventasOk: ventas.ok,
    ventasErrores: ventas.errores,
  };
}

// Utilidad para generar ID único local
export function generarIdLocal(): string {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Guardar venta offline en IndexedDB
export async function guardarVentaOffline(
  venta: Omit<VentaOffline, 'id' | 'creadoEn' | 'estado'>,
): Promise<string> {
  const id = generarIdLocal();
  await db.ventasOffline.add({
    ...venta,
    id,
    estado: 'PENDIENTE_SYNC',
    creadoEn: Date.now(),
  });
  return id;
}
