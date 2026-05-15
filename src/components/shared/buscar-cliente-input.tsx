'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface ClienteResult {
  id: string;
  nombre: string;
  identificacion?: string | null;
  tipoIdentificacion?: string;
}

interface Props {
  onSelect: (cliente: ClienteResult) => void;
  placeholder?: string;
  defaultValue?: string;
}

export function BuscarClienteInput({
  onSelect,
  placeholder = 'Buscar cliente...',
  defaultValue = '',
}: Props) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<ClienteResult[]>([]);
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
        const res = await fetch(`/api/clientes?search=${encodeURIComponent(query)}&limit=5`);
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

  function handleSelect(cliente: ClienteResult) {
    setQuery(cliente.nombre);
    setOpen(false);
    setResults([]);
    onSelect(cliente);
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
          {results.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
              onClick={() => handleSelect(cliente)}
            >
              <span className="font-medium">{cliente.nombre}</span>
              {cliente.identificacion && (
                <span className="ml-2 text-slate-400 text-xs">{cliente.identificacion}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-md px-3 py-2 text-sm text-slate-400">
          No se encontraron clientes
        </div>
      )}
    </div>
  );
}
