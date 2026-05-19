'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calcularItemNomina, calcularNomina } from '@/lib/nomina';

interface EmpleadoSelect {
  id: string;
  nombre: string;
  apellido: string;
  cargo: string;
  salarioBase: unknown;
}

interface ItemForm {
  empleadoId: string;
  incluir: boolean;
  diasTrabajados: string;
  otrosIngresos: string;
  otrosDescuentos: string;
}

export default function NuevaNominaForm({ empleados }: { empleados: EmpleadoSelect[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [periodo, setPeriodo] = useState(
    `${hoy.toLocaleString('es-DO', { month: 'long' })} ${hoy.getFullYear()}`,
  );
  const [fechaInicio, setFechaInicio] = useState(inicioMes);
  const [fechaFin, setFechaFin] = useState(finMes);

  const [items, setItems] = useState<ItemForm[]>(
    empleados.map((e) => ({
      empleadoId: e.id,
      incluir: true,
      diasTrabajados: '23.83',
      otrosIngresos: '0',
      otrosDescuentos: '0',
    })),
  );

  function updateItem(idx: number, field: keyof ItemForm, value: string | boolean) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  const preview = useMemo(() => {
    return items
      .filter((it) => it.incluir)
      .map((it) => {
        const emp = empleados.find((e) => e.id === it.empleadoId)!;
        return calcularItemNomina({
          salarioBase: Number(emp.salarioBase),
          diasTrabajados: parseFloat(it.diasTrabajados) || 23.83,
          otrosIngresos: parseFloat(it.otrosIngresos) || 0,
          otrosDescuentos: parseFloat(it.otrosDescuentos) || 0,
        });
      });
  }, [items, empleados]);

  const resumen = useMemo(() => calcularNomina(preview), [preview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const itemsSeleccionados = items
      .filter((it) => it.incluir)
      .map((it) => ({
        empleadoId: it.empleadoId,
        diasTrabajados: parseFloat(it.diasTrabajados) || 23.83,
        otrosIngresos: parseFloat(it.otrosIngresos) || 0,
        otrosDescuentos: parseFloat(it.otrosDescuentos) || 0,
      }));

    if (itemsSeleccionados.length === 0) {
      setError('Selecciona al menos un empleado para la nómina.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/nomina/nominas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo, fechaInicio, fechaFin, items: itemsSeleccionados }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al crear la nómina.');
        return;
      }
      router.push(`/nomina/nominas/${data.data.id}`);
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) => `RD$ ${n.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva nómina</h1>
        <p className="text-slate-500 text-sm mt-1">Selecciona empleados y ajusta los valores.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Encabezado de la nómina */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Datos de la nómina
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="periodo">Período *</Label>
              <Input
                id="periodo"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaInicio">Fecha inicio *</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaFin">Fecha fin *</Label>
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Tabla de empleados */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Empleados ({items.filter((i) => i.incluir).length} seleccionados)
            </h2>
          </div>

          {empleados.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-sm">
              No hay empleados activos. Agrega empleados primero.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left w-8" />
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Empleado</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">
                      Salario base
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600 w-24">
                      Días trab.
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600 w-28">
                      Otros ing.
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600 w-28">
                      Otros desc.
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">TSS</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">ISR</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const emp = empleados.find((e) => e.id === it.empleadoId)!;
                    const calc = it.incluir
                      ? calcularItemNomina({
                          salarioBase: Number(emp.salarioBase),
                          diasTrabajados: parseFloat(it.diasTrabajados) || 23.83,
                          otrosIngresos: parseFloat(it.otrosIngresos) || 0,
                          otrosDescuentos: parseFloat(it.otrosDescuentos) || 0,
                        })
                      : null;

                    return (
                      <tr
                        key={it.empleadoId}
                        className={`border-b border-slate-100 ${!it.incluir ? 'opacity-40' : ''}`}
                      >
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={it.incluir}
                            onChange={(e) => updateItem(idx, 'incluir', e.target.checked)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <p className="font-medium text-slate-900">
                            {emp.apellido}, {emp.nombre}
                          </p>
                          <p className="text-xs text-slate-400">{emp.cargo}</p>
                        </td>
                        <td className="px-4 py-2 text-right text-slate-700">
                          {fmt(Number(emp.salarioBase))}
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            min="0"
                            max="31"
                            step="0.01"
                            value={it.diasTrabajados}
                            onChange={(e) => updateItem(idx, 'diasTrabajados', e.target.value)}
                            disabled={!it.incluir}
                            className="text-center h-8 text-xs"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.otrosIngresos}
                            onChange={(e) => updateItem(idx, 'otrosIngresos', e.target.value)}
                            disabled={!it.incluir}
                            className="text-right h-8 text-xs"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.otrosDescuentos}
                            onChange={(e) => updateItem(idx, 'otrosDescuentos', e.target.value)}
                            disabled={!it.incluir}
                            className="text-right h-8 text-xs"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-slate-500 text-xs">
                          {calc ? fmt(calc.tssTrabajador) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-500 text-xs">
                          {calc ? fmt(calc.isr) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-emerald-700">
                          {calc ? fmt(calc.salarioNeto) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total bruto', value: resumen.totalBruto, color: 'text-slate-900' },
            { label: 'TSS empleados', value: resumen.totalTSS, color: 'text-amber-600' },
            { label: 'ISR total', value: resumen.totalISR, color: 'text-amber-600' },
            { label: 'Otros desc.', value: resumen.totalOtros, color: 'text-slate-500' },
            { label: 'Total a pagar', value: resumen.totalNeto, color: 'text-emerald-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{fmt(value)}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creando nómina...' : 'Crear nómina'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
