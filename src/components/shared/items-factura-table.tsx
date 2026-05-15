'use client';

import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BuscarProductoInput } from './buscar-producto-input';
import { MoneyDisplay } from './money-display';

export interface ItemRow {
  _id: string;
  productoId?: string;
  productoNombre: string;
  productoSku?: string;
  cantidad: number;
  precioUnitario: number;
  itbisPorcentaje: number;
  descuento: number;
}

interface Props {
  items: ItemRow[];
  onChange: (items: ItemRow[]) => void;
}

function calcItem(item: ItemRow) {
  const subtotal = Math.round(item.cantidad * item.precioUnitario * 100) / 100;
  const itbisMonto = Math.round(subtotal * (item.itbisPorcentaje / 100) * 100) / 100;
  const total = Math.round((subtotal + itbisMonto - item.descuento) * 100) / 100;
  return { subtotal, itbisMonto, total };
}

function newEmptyItem(): ItemRow {
  return {
    _id: Math.random().toString(36).slice(2),
    productoNombre: '',
    cantidad: 1,
    precioUnitario: 0,
    itbisPorcentaje: 18,
    descuento: 0,
  };
}

export function ItemsFacturaTable({ items, onChange }: Props) {
  function addEmpty() {
    onChange([...items, newEmptyItem()]);
  }

  function remove(id: string) {
    onChange(items.filter((i) => i._id !== id));
  }

  function update(id: string, field: keyof ItemRow, value: string | number) {
    onChange(
      items.map((item) =>
        item._id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addFromProducto(producto: {
    id: string;
    nombre: string;
    sku?: string | null;
    precioVenta: number | string;
    itbisAplicable: boolean;
    tipo: string;
  }) {
    const row: ItemRow = {
      _id: Math.random().toString(36).slice(2),
      productoId: producto.id,
      productoNombre: producto.nombre,
      productoSku: producto.sku ?? undefined,
      cantidad: 1,
      precioUnitario: Number(producto.precioVenta),
      itbisPorcentaje: producto.itbisAplicable ? 18 : 0,
      descuento: 0,
    };
    onChange([...items, row]);
  }

  const totalesGlobales = items.reduce(
    (acc, item) => {
      const c = calcItem(item);
      return {
        subtotal: acc.subtotal + c.subtotal,
        itbis: acc.itbis + c.itbisMonto,
        total: acc.total + c.total,
      };
    },
    { subtotal: 0, itbis: 0, total: 0 },
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-slate-700">Productos / Servicios</p>
        <div className="ml-auto flex gap-2">
          <div className="w-56">
            <BuscarProductoInput
              onSelect={addFromProducto}
              placeholder="Buscar producto..."
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addEmpty}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar item
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          Agrega al menos un producto o servicio
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="pb-2 text-left font-medium pr-2">Producto/Servicio</th>
                <th className="pb-2 text-right font-medium px-2 w-20">Cant.</th>
                <th className="pb-2 text-right font-medium px-2 w-28">Precio unit.</th>
                <th className="pb-2 text-right font-medium px-2 w-20">ITBIS%</th>
                <th className="pb-2 text-right font-medium px-2 w-24">Desc.</th>
                <th className="pb-2 text-right font-medium px-2 w-24">Subtotal</th>
                <th className="pb-2 text-right font-medium pl-2 w-24">Total</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const calc = calcItem(item);
                return (
                  <tr key={item._id} className="group">
                    <td className="py-2 pr-2">
                      <Input
                        value={item.productoNombre}
                        onChange={(e) => update(item._id, 'productoNombre', e.target.value)}
                        placeholder="Nombre del producto o servicio"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.cantidad}
                        onChange={(e) =>
                          update(item._id, 'cantidad', parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-sm text-right w-20"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precioUnitario}
                        onChange={(e) =>
                          update(item._id, 'precioUnitario', parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-sm text-right w-28"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={item.itbisPorcentaje}
                        onChange={(e) =>
                          update(item._id, 'itbisPorcentaje', parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-sm text-right w-20"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.descuento}
                        onChange={(e) =>
                          update(item._id, 'descuento', parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-sm text-right w-24"
                      />
                    </td>
                    <td className="py-2 px-2 text-right text-slate-600 w-24">
                      <MoneyDisplay amount={calc.subtotal} currency="" />
                    </td>
                    <td className="py-2 pl-2 text-right font-medium w-24">
                      <MoneyDisplay amount={calc.total} currency="" />
                    </td>
                    <td className="py-2 pl-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(item._id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm border-t border-slate-200 pt-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <MoneyDisplay amount={totalesGlobales.subtotal} currency="RD$" />
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ITBIS</span>
              <MoneyDisplay amount={totalesGlobales.itbis} currency="RD$" />
            </div>
            <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-1">
              <span>Total</span>
              <MoneyDisplay amount={totalesGlobales.total} currency="RD$" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
