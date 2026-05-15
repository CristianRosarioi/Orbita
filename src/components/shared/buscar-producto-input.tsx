'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface ProductoResult {
  id: string;
  nombre: string;
  sku?: string | null;
  precioVenta: number | string;
  itbisAplicable: boolean;
  tipo: string;
}

interface Props {
  onSelect: (producto: ProductoResult) => void;
  placeholder?: string;
}

export function BuscarProductoInput({ onSelect, placeholder = 'Buscar producto...' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 2) {
      debounceRef.current = setTimeout(() => {
        setResults([]);
        setOpen(false);
      }, 0);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/productos/buscar?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.data?.items ?? []);
          setOpen(true);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(producto: ProductoResult) {
    setQuery('');
    setOpen(false);
    setResults([]);
    onSelect(producto);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-md">
          {results.map((producto) => (
            <button
              key={producto.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
              onClick={() => handleSelect(producto)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{producto.nombre}</span>
                <span className="text-slate-500 text-xs">
                  RD$ {Number(producto.precioVenta).toFixed(2)}
                </span>
              </div>
              {producto.sku && (
                <span className="text-slate-400 text-xs">SKU: {producto.sku}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-md px-3 py-2 text-sm text-slate-400">
          No se encontraron productos
        </div>
      )}
    </div>
  );
}
