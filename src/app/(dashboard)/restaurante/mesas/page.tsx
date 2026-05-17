'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, List } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MesaCard } from '@/components/shared/mesa-card';
import { CrearComandaModal } from '@/components/shared/crear-comanda-modal';

interface Mesa {
  id: string;
  numero: number;
  nombre: string | null;
  capacidad: number;
  estado: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'INACTIVA';
  comandas: Array<{ id: string; numero: number }>;
}

export default function MesasPage() {
  const router = useRouter();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMesa, setModalMesa] = useState<Mesa | null>(null);

  const cargarMesas = useCallback(async () => {
    try {
      const res = await fetch('/api/restaurante/mesas');
      const data = await res.json();
      if (data.success) setMesas(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarMesas(); }, [cargarMesas]);

  function handleClickMesa(mesa: Mesa) {
    if (mesa.estado === 'OCUPADA' && mesa.comandas[0]) {
      router.push(`/restaurante/comandas/${mesa.comandas[0].id}`);
    } else if (mesa.estado === 'DISPONIBLE') {
      setModalMesa(mesa);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mesas</h1>
          <p className="text-slate-500 text-sm mt-1">Panel visual de mesas del restaurante</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarMesas}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link href="/restaurante/comandas">
            <Button variant="outline">
              <List className="h-4 w-4 mr-1.5" />
              Ver comandas
            </Button>
          </Link>
          <Button onClick={() => router.push('/restaurante/mesas/nueva')}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva mesa
          </Button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        {[
          { color: 'bg-emerald-200', label: 'Disponible' },
          { color: 'bg-red-200', label: 'Ocupada' },
          { color: 'bg-amber-200', label: 'Reservada' },
          { color: 'bg-slate-200', label: 'Inactiva' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full ${color}`} />
            {label}
          </span>
        ))}
      </div>

      {mesas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">Sin mesas configuradas</p>
          <p className="text-sm text-slate-400 mt-1">Agrega las mesas de tu restaurante</p>
          <Button className="mt-4" onClick={() => router.push('/restaurante/mesas/nueva')}>
            Agregar primera mesa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {mesas.map((mesa) => (
            <MesaCard
              key={mesa.id}
              numero={mesa.numero}
              nombre={mesa.nombre}
              capacidad={mesa.capacidad}
              estado={mesa.estado}
              comandaNumero={mesa.comandas[0]?.numero}
              onClick={() => handleClickMesa(mesa)}
            />
          ))}
        </div>
      )}

      {modalMesa && (
        <CrearComandaModal
          mesaId={modalMesa.id}
          mesaNumero={modalMesa.numero}
          onClose={() => { setModalMesa(null); cargarMesas(); }}
        />
      )}
    </div>
  );
}
