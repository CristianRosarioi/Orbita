'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

import { CreateProveedorSchema, type CreateProveedorInput } from '@/lib/validations/proveedores';
import { TipoIdentificacion } from '@/types/enums';

interface ProveedorFormProps {
  defaultValues?: Partial<CreateProveedorInput>;
  proveedorId?: string;
}

export function ProveedorForm({ defaultValues, proveedorId }: ProveedorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProveedorInput>({
    resolver: zodResolver(CreateProveedorSchema),
    defaultValues: {
      tipoIdentificacion: TipoIdentificacion.RNC,
      diasCredito: 0,
      ...defaultValues,
    },
  });

  const onSubmit = async (data: CreateProveedorInput) => {
    setLoading(true);
    try {
      const url = proveedorId ? `/api/proveedores/${proveedorId}` : '/api/proveedores';
      const method = proveedorId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Ocurrió un error al guardar el proveedor.');
        return;
      }

      toast.success(proveedorId ? 'Proveedor actualizado.' : 'Proveedor creado exitosamente.');
      router.push('/proveedores');
      router.refresh();
    } catch {
      toast.error('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo de identificación */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tipoIdentificacion">Tipo de identificación</Label>
          <select
            id="tipoIdentificacion"
            {...register('tipoIdentificacion')}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value={TipoIdentificacion.RNC}>RNC</option>
            <option value={TipoIdentificacion.CEDULA}>Cédula</option>
            <option value={TipoIdentificacion.PASAPORTE}>Pasaporte</option>
            <option value={TipoIdentificacion.SIN_IDENTIFICACION}>Sin identificación</option>
          </select>
          {errors.tipoIdentificacion && (
            <p className="text-xs text-red-500">{errors.tipoIdentificacion.message}</p>
          )}
        </div>

        {/* Número de identificación */}
        <div className="space-y-2">
          <Label htmlFor="identificacion">Número de identificación</Label>
          <Input id="identificacion" {...register('identificacion')} placeholder="000000000" />
          {errors.identificacion && (
            <p className="text-sm text-red-600">{errors.identificacion.message}</p>
          )}
        </div>

        {/* Nombre / Razón social */}
        <div className="space-y-2">
          <Label htmlFor="nombre">
            Nombre / Razón social <span className="text-red-500">*</span>
          </Label>
          <Input id="nombre" {...register('nombre')} placeholder="Distribuidora S.R.L." />
          {errors.nombre && <p className="text-sm text-red-600">{errors.nombre.message}</p>}
        </div>

        {/* Nombre comercial */}
        <div className="space-y-2">
          <Label htmlFor="nombreComercial">Nombre comercial</Label>
          <Input
            id="nombreComercial"
            {...register('nombreComercial')}
            placeholder="Nombre en el mercado"
          />
          {errors.nombreComercial && (
            <p className="text-sm text-red-600">{errors.nombreComercial.message}</p>
          )}
        </div>

        {/* Contacto */}
        <div className="space-y-2">
          <Label htmlFor="contacto">Persona de contacto</Label>
          <Input id="contacto" {...register('contacto')} placeholder="Juan Pérez" />
          {errors.contacto && (
            <p className="text-sm text-red-600">{errors.contacto.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" {...register('email')} placeholder="contacto@proveedor.com" />
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
          <Input id="ciudad" {...register('ciudad')} placeholder="Santiago" />
          {errors.ciudad && <p className="text-sm text-red-600">{errors.ciudad.message}</p>}
        </div>

        {/* Provincia */}
        <div className="space-y-2">
          <Label htmlFor="provincia">Provincia</Label>
          <Input id="provincia" {...register('provincia')} placeholder="Santiago" />
          {errors.provincia && <p className="text-sm text-red-600">{errors.provincia.message}</p>}
        </div>

        {/* Días de crédito */}
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
          placeholder="Información adicional sobre el proveedor..."
          rows={3}
        />
        {errors.notas && <p className="text-sm text-red-600">{errors.notas.message}</p>}
      </div>

      <Separator />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : proveedorId ? 'Actualizar proveedor' : 'Crear proveedor'}
        </Button>
        <Link href="/proveedores" className="text-sm text-slate-600 hover:text-slate-900">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
