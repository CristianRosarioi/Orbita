'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  CreateCategoriaSchema,
  type CreateCategoriaInput,
  type UpdateCategoriaInput,
} from '@/lib/validations/categorias';

interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string | null;
  color?: string | null;
  icono?: string | null;
  activa: boolean;
  _count?: { productos: number };
}

function ColorDot({ color }: { color?: string | null }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full border border-slate-200 shrink-0"
      style={{ backgroundColor: color ?? '#94a3b8' }}
    />
  );
}

interface InlineFormProps {
  defaultValues?: Partial<CreateCategoriaInput>;
  onSave: (data: CreateCategoriaInput) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

function InlineForm({ defaultValues, onSave, onCancel, loading }: InlineFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateCategoriaInput>({
    resolver: zodResolver(CreateCategoriaSchema),
    defaultValues: { orden: 0, ...defaultValues },
  });

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="flex items-end gap-3 p-3 bg-slate-50 rounded-md border border-slate-200"
    >
      <div className="flex-1 space-y-1">
        <Label htmlFor="cat-nombre" className="text-xs">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cat-nombre"
          {...register('nombre')}
          placeholder="Ej: Bebidas"
          className="h-8 text-sm"
          autoFocus
        />
        {errors.nombre && <p className="text-xs text-red-600">{errors.nombre.message}</p>}
      </div>
      <div className="w-28 space-y-1">
        <Label htmlFor="cat-color" className="text-xs">
          Color
        </Label>
        <Input
          id="cat-color"
          {...register('color')}
          placeholder="#3b82f6"
          className="h-8 text-sm font-mono"
        />
      </div>
      <div className="w-28 space-y-1">
        <Label htmlFor="cat-icono" className="text-xs">
          Icono
        </Label>
        <Input
          id="cat-icono"
          {...register('icono')}
          placeholder="shopping-bag"
          className="h-8 text-sm"
        />
      </div>
      <div className="flex gap-1.5">
        <Button type="submit" size="sm" disabled={loading} className="h-8">
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="h-8"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const res = await fetch('/api/categorias');
      const json = await res.json();
      if (json.success) setCategorias(json.data);
    } catch {
      toast.error('Error cargando categorías.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/categorias')
      .then((r) => r.json() as Promise<{ success: boolean; data: Categoria[] }>)
      .then((json) => {
        if (active && json.success) setCategorias(json.data);
      })
      .catch(() => { if (active) toast.error('Error cargando categorías.'); })
      .finally(() => { if (active) setCargando(false); });
    return () => { active = false; };
  }, []);

  const handleCrear = async (data: CreateCategoriaInput) => {
    setSaving(true);
    try {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al crear la categoría.');
        return;
      }
      toast.success('Categoría creada.');
      setCreando(false);
      await cargar();
    } catch {
      toast.error('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = async (id: string, data: UpdateCategoriaInput) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/categorias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al actualizar la categoría.');
        return;
      }
      toast.success('Categoría actualizada.');
      setEditandoId(null);
      await cargar();
    } catch {
      toast.error('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'No se puede eliminar esta categoría.');
        return;
      }
      toast.success('Categoría eliminada.');
      setEliminandoId(null);
      await cargar();
    } catch {
      toast.error('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActiva = async (categoria: Categoria) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/categorias/${categoria.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !categoria.activa }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? 'Error al actualizar.');
        return;
      }
      setCategorias((prev) =>
        prev.map((c) => (c.id === categoria.id ? { ...c, activa: !c.activa } : c)),
      );
    } catch {
      toast.error('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categorías</h1>
          <p className="text-slate-500 text-sm mt-1">
            Organiza tus productos en categorías
          </p>
        </div>
        <Button
          onClick={() => {
            setCreando(true);
            setEditandoId(null);
          }}
          size="sm"
          disabled={creando}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva categoría
        </Button>
      </div>

      {/* Formulario de nueva categoría */}
      {creando && (
        <InlineForm
          onSave={handleCrear}
          onCancel={() => setCreando(false)}
          loading={saving}
        />
      )}

      {/* Lista */}
      {cargando ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : categorias.length === 0 && !creando ? (
        <div className="text-center py-16">
          <Tag className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No hay categorías</p>
          <p className="text-slate-400 text-sm mt-1">Crea la primera para organizar tus productos.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {categorias.map((cat) =>
            editandoId === cat.id ? (
              <InlineForm
                key={cat.id}
                defaultValues={{
                  nombre: cat.nombre,
                  color: cat.color ?? undefined,
                  icono: cat.icono ?? undefined,
                }}
                onSave={(data) => handleEditar(cat.id, data)}
                onCancel={() => setEditandoId(null)}
                loading={saving}
              />
            ) : (
              <div
                key={cat.id}
                className="flex items-center gap-3 px-4 py-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
              >
                <ColorDot color={cat.color} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-900 text-sm">{cat.nombre}</span>
                  {cat.icono && (
                    <span className="ml-2 text-xs text-slate-400 font-mono">{cat.icono}</span>
                  )}
                </div>
                {cat._count !== undefined && (
                  <span className="text-xs text-slate-400">
                    {cat._count.productos}{' '}
                    {cat._count.productos === 1 ? 'producto' : 'productos'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleActiva(cat)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    cat.activa
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.activa ? 'Activa' : 'Inactiva'}
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditandoId(cat.id);
                      setCreando(false);
                    }}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEliminandoId(cat.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog
        open={eliminandoId !== null}
        onOpenChange={(open) => !open && setEliminandoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los productos asociados quedarán sin categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => eliminandoId && handleEliminar(eliminandoId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
