'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NuevoEmpleadoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    cargo: '',
    departamento: '',
    salarioBase: '',
    tipoContrato: 'INDEFINIDO',
    frecuenciaPago: 'MENSUAL',
    fechaIngreso: '',
    email: '',
    telefono: '',
    numeroCuenta: '',
    banco: '',
    notas: '',
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/nomina/empleados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          salarioBase: parseFloat(form.salarioBase),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Error al crear el empleado.');
        return;
      }
      router.push('/nomina/empleados');
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nuevo empleado</h1>
        <p className="text-slate-500 text-sm mt-1">Completa los datos del empleado.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white rounded-lg border border-slate-200 p-6"
      >
        {/* Datos personales */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Datos personales
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                value={form.apellido}
                onChange={(e) => handleChange('apellido', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cedula">Cédula (11 dígitos) *</Label>
            <Input
              id="cedula"
              value={form.cedula}
              onChange={(e) =>
                handleChange('cedula', e.target.value.replace(/\D/g, '').slice(0, 11))
              }
              placeholder="00000000000"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={form.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Datos laborales */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Datos laborales
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cargo">Cargo *</Label>
              <Input
                id="cargo"
                value={form.cargo}
                onChange={(e) => handleChange('cargo', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="departamento">Departamento</Label>
              <Input
                id="departamento"
                value={form.departamento}
                onChange={(e) => handleChange('departamento', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salarioBase">Salario base mensual (RD$) *</Label>
            <Input
              id="salarioBase"
              type="number"
              min="0"
              step="0.01"
              value={form.salarioBase}
              onChange={(e) => handleChange('salarioBase', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo de contrato *</Label>
              <Select
                value={form.tipoContrato}
                onValueChange={(v) => handleChange('tipoContrato', v ?? 'INDEFINIDO')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDEFINIDO">Indefinido</SelectItem>
                  <SelectItem value="DETERMINADO">Determinado</SelectItem>
                  <SelectItem value="POR_OBRA">Por obra</SelectItem>
                  <SelectItem value="TEMPORAL">Temporal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Frecuencia de pago *</Label>
              <Select
                value={form.frecuenciaPago}
                onValueChange={(v) => handleChange('frecuenciaPago', v ?? 'MENSUAL')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMANAL">Semanal</SelectItem>
                  <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                  <SelectItem value="MENSUAL">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fechaIngreso">Fecha de ingreso *</Label>
            <Input
              id="fechaIngreso"
              type="date"
              value={form.fechaIngreso}
              onChange={(e) => handleChange('fechaIngreso', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Datos bancarios */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Datos bancarios
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="banco">Banco</Label>
              <Input
                id="banco"
                value={form.banco}
                onChange={(e) => handleChange('banco', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numeroCuenta">Número de cuenta</Label>
              <Input
                id="numeroCuenta"
                value={form.numeroCuenta}
                onChange={(e) => handleChange('numeroCuenta', e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar empleado'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
