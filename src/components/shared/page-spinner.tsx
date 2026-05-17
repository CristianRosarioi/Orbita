import { Loader2 } from 'lucide-react';

interface PageSpinnerProps {
  texto?: string;
}

export function PageSpinner({ texto = 'Cargando...' }: PageSpinnerProps) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      <p className="text-sm text-slate-400">{texto}</p>
    </div>
  );
}
