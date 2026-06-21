'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { CreateClienteSchema, type CreateClienteInput } from '@/lib/validations/clientes';
import { TipoCliente, TipoIdentificacion } from '@/types/enums';

interface ClienteFormProps {
  defaultValues?: Partial<CreateClienteInput>;
  clienteId?: string;
}

export function ClienteForm({ defaultValues, clienteId }: ClienteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [creditoAbierto, setCreditoAbierto] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateClienteInput>({
    resolver: zodResolver(CreateClienteSchema),
    defaultValues: {
      tipo: TipoCliente.PERSONA,
      tipoIdentificacion: TipoIdentificacion.CEDULA,
      limiteCredito: 0,
      diasCredito: 0,
      ...defaultValues,
    },
  });

  const tipo = watch('tipo');

  const onSubmit = async (data: CreateClienteInput) => {
    setLoading(true);
    try {
      const url = clienteId ? `/api/clientes/${clienteId}` : '/api/clientes';
      const method = clienteId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Ocurrió un error al guardar el cliente.');
        return;
      }

      toast.success(clienteId ? 'Cliente actualizado.' : 'Cliente creado exitosamente.');
      router.push('/clientes');
      router.refresh();
    } catch {
      toast.error('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tipo de cliente */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tipo de cliente
          </h2>
        </div>
        <RadioGroup
          value={tipo}
          onValueChange={(val) => setValue('tipo', val as TipoCliente)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value={TipoCliente.PERSONA} id="tipo-persona" />
            <Label htmlFor="tipo-persona" className="cursor-pointer font-normal">
              Persona
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value={TipoCliente.EMPRESA} id="tipo-empresa" />
            <Label htmlFor="tipo-empresa" className="cursor-pointer font-normal">
              Empresa
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Información de contacto
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de identificación */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipoIdentificacion">Tipo de identificación</Label>
            <select
              id="tipoIdentificacion"
              {...register('tipoIdentificacion')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value={TipoIdentificacion.CEDULA}>Cédula</option>
              <option value={TipoIdentificacion.RNC}>RNC</option>
              <option value={TipoIdentificacion.PASAPORTE}>Pasaporte</option>
              <option value={TipoIdentificacion.SIN_IDENTIFICACION}>Sin identificación</option>
            </select>
            {errors.tipoIdentificacion && (
              <p className="text-xs text-red-500">{errors.tipoIdentificacion.message}</p>
            )}
          </div>

          {/* Identificación */}
          <div className="space-y-2">
            <Label htmlFor="identificacion">Número de identificación</Label>
            <Input
              id="identificacion"
              {...register('identificacion')}
              placeholder="000-0000000-0"
            />
            {errors.identificacion && (
              <p className="text-sm text-red-600">{errors.identificacion.message}</p>
            )}
          </div>

          {/* Nombre / Razón Social */}
          <div className="space-y-2">
            <Label htmlFor="nombre">
              {tipo === TipoCliente.EMPRESA ? 'Razón social' : 'Nombre'}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="nombre"
              {...register('nombre')}
              placeholder={tipo === TipoCliente.EMPRESA ? 'Empresa S.R.L.' : 'Juan Pérez'}
            />
            {errors.nombre && <p className="text-sm text-red-600">{errors.nombre.message}</p>}
          </div>

          {/* Nombre comercial — solo empresas */}
          {tipo === TipoCliente.EMPRESA && (
            <div className="space-y-2">
              <Label htmlFor="nombreComercial">Nombre comercial</Label>
              <Input
                id="nombreComercial"
                {...register('nombreComercial')}
                placeholder="Nombre que usa en el mercado"
              />
              {errors.nombreComercial && (
                <p className="text-sm text-red-600">{errors.nombreComercial.message}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="correo@ejemplo.com"
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" {...register('telefono')} placeholder="809-000-0000" />
            {errors.telefono && <p className="text-sm text-red-600">{errors.telefono.message}</p>}
          </div>

          {/* Celular */}
          <div className="space-y-2">
            <Label htmlFor="celular">Celular</Label>
            <Input id="celular" {...register('celular')} placeholder="829-000-0000" />
            {errors.celular && <p className="text-sm text-red-600">{errors.celular.message}</p>}
          </div>

          {/* Ciudad */}
          <div className="space-y-2">
            <Label htmlFor="ciudad">Ciudad</Label>
            <Input id="ciudad" {...register('ciudad')} placeholder="Santo Domingo" />
            {errors.ciudad && <p className="text-sm text-red-600">{errors.ciudad.message}</p>}
          </div>

          {/* Provincia */}
          <div className="space-y-2">
            <Label htmlFor="provincia">Provincia</Label>
            <Input id="provincia" {...register('provincia')} placeholder="Distrito Nacional" />
            {errors.provincia && <p className="text-sm text-red-600">{errors.provincia.message}</p>}
          </div>
        </div>

        {/* Dirección */}
        <div className="space-y-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Textarea
            id="direccion"
            {...register('direccion')}
            placeholder="Calle, número, sector..."
            rows={2}
          />
          {errors.direccion && <p className="text-sm text-red-600">{errors.direccion.message}</p>}
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <Label htmlFor="notas">Notas internas</Label>
          <Textarea
            id="notas"
            {...register('notas')}
            placeholder="Cualquier información adicional..."
            rows={3}
          />
          {errors.notas && <p className="text-sm text-red-600">{errors.notas.message}</p>}
        </div>
      </div>
      {/* end Información de contacto card */}

      {/* Límite de crédito — colapsable */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setCreditoAbierto((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>Límite de crédito</span>
          {creditoAbierto ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>
        {creditoAbierto && (
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="limiteCredito">Límite de crédito (RD$)</Label>
              <Input
                id="limiteCredito"
                type="number"
                min={0}
                step={0.01}
                {...register('limiteCredito', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.limiteCredito && (
                <p className="text-sm text-red-600">{errors.limiteCredito.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="diasCredito">Días de crédito</Label>
              <Input
                id="diasCredito"
                type="number"
                min={0}
                step={1}
                {...register('diasCredito', { valueAsNumber: true })}
                placeholder="30"
              />
              {errors.diasCredito && (
                <p className="text-sm text-red-600">{errors.diasCredito.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botones — barra fija en la parte inferior */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 -mx-6 flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : clienteId ? 'Actualizar cliente' : 'Crear cliente'}
        </Button>
        <Link href="/clientes" className="text-sm text-slate-600 hover:text-slate-900">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
