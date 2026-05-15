'use client';

import { useState, useEffect } from 'react';
import { Plus, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface UnidadMedida {
  id: string;
  nombre: string;
  abreviatura: string;
  esBase: boolean;
  activa: boolean;
}

export default function UnidadesMedidaPage() {
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({ nombre: '', abreviatura: '' });

  async function cargar() {
    const res = await fetch('/api/unidades-medida');
    const json = await res.json();
    if (json.success) setUnidades(json.data);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    fetch('/api/unidades-medida')
      .then((r) => r.json() as Promise<{ success: boolean; data: UnidadMedida[] }>)
      .then((json) => {
        if (active && json.success) setUnidades(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function crear() {
    if (!form.nombre.trim() || !form.abreviatura.trim()) {
      toast.error('El nombre y la abreviatura son requeridos.');
      return;
    }
    const res = await fetch('/api/unidades-medida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.success) {
      toast.success('Unidad creada.');
      setCreando(false);
      setForm({ nombre: '', abreviatura: '' });
      cargar();
    } else {
      toast.error(json.error?.message ?? 'No se pudo crear la unidad.');
    }
  }

  async function eliminar(id: string) {
    const res = await fetch(`/api/unidades-medida/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      toast.success('Unidad eliminada.');
      cargar();
    } else {
      toast.error(json.error?.message ?? 'No se pudo eliminar.');
    }
  }

  const base = unidades.filter((u) => u.esBase);
  const custom = unidades.filter((u) => !u.esBase);

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Unidades de Medida</h1>
          <p className="text-sm text-slate-500">
            {base.length} unidades base + {custom.length} personalizadas
          </p>
        </div>
        <Button onClick={() => setCreando(true)} className="bg-slate-900 hover:bg-slate-700">
          <Plus className="h-4 w-4 mr-1.5" /> Nueva Unidad
        </Button>
      </div>

      {creando && (
        <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
          <p className="text-sm font-medium text-slate-700">Nueva unidad personalizada</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="u-nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="u-nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej. Barril"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="u-abrev">
                Abreviatura <span className="text-red-500">*</span>
              </Label>
              <Input
                id="u-abrev"
                value={form.abreviatura}
                onChange={(e) => setForm((f) => ({ ...f, abreviatura: e.target.value }))}
                placeholder="Ej. brl"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setCreando(false);
                setForm({ nombre: '', abreviatura: '' });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={crear} className="bg-slate-900 hover:bg-slate-700">
              Guardar
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {custom.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Personalizadas
              </p>
              <div className="space-y-1.5">
                {custom.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-900 text-sm flex-1">{u.nombre}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {u.abreviatura}
                    </Badge>
                    <ConfirmDialog
                      trigger={
                        <button
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      }
                      title="¿Eliminar unidad?"
                      description={`Se eliminará "${u.nombre} (${u.abreviatura})".`}
                      confirmLabel="Eliminar"
                      onConfirm={() => eliminar(u.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Unidades base del sistema
            </p>
            <div className="space-y-1.5">
              {base.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50"
                >
                  <span className="font-medium text-slate-700 text-sm flex-1">{u.nombre}</span>
                  <Badge variant="outline" className="text-xs font-mono text-slate-500">
                    {u.abreviatura}
                  </Badge>
                  <Lock
                    className="h-3.5 w-3.5 text-slate-300"
                    aria-label="Unidad base — no se puede eliminar"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
