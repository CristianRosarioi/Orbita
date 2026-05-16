'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock } from 'lucide-react';

export default function Reporte607Page() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reporte 607</h1>
        <p className="text-slate-500 text-sm mt-1">Relación de comprobantes fiscales recibidos</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          El reporte 607 requiere el módulo de <strong>Compras y Gastos</strong>, que se implementará en la Fase 6
          de Órbita. Este módulo registrará las compras a proveedores con sus NCF correspondientes.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Estado del módulo</CardTitle>
          <Badge variant="secondary">Próximamente</Badge>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Módulo de Compras en desarrollo</p>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            Cuando esté disponible, podrás registrar compras a proveedores y generar el reporte 607
            con toda la información fiscal requerida por la DGII.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
