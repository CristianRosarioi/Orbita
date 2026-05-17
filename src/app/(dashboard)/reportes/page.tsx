'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileDown, BarChart2, AlertCircle } from 'lucide-react';

const REPORTES = [
  {
    href: '/reportes/606',
    titulo: 'Reporte 606',
    subtitulo: 'Relación de comprobantes fiscales emitidos',
    descripcion:
      'Ventas a clientes: NCF, montos, ITBIS facturado y tipo de comprobante por período mensual.',
    disponible: true,
  },
  {
    href: '/reportes/607',
    titulo: 'Reporte 607',
    subtitulo: 'Relación de comprobantes fiscales recibidos',
    descripcion:
      'Compras a proveedores con NCF, disponible cuando se implemente el módulo de compras (Fase 6).',
    disponible: false,
  },
  {
    href: '/reportes/608',
    titulo: 'Reporte 608',
    subtitulo: 'Relación de comprobantes anulados',
    descripcion: 'NCF anulados en el período: facturas canceladas que deben reportarse a la DGII.',
    disponible: true,
  },
];

export default function ReportesPage() {
  return (
    <div className="p-4 space-y-4 md:p-6 md:space-y-6">
      <div className="flex items-center gap-3">
        <BarChart2 className="h-6 w-6 text-slate-700" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Centro de Reportes DGII
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Genera y exporta los reportes requeridos por la Dirección General de Impuestos Internos
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          Las empresas en <strong>Modo Simple</strong> generan reportes referenciales. Para validez
          fiscal ante la DGII activa el Modo Fiscal en Configuración.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {REPORTES.map((r) => (
          <Card
            key={r.href}
            className={`relative ${!r.disponible ? 'opacity-70' : 'hover:shadow-md transition-shadow'}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold">{r.titulo}</CardTitle>
                {r.disponible ? (
                  <Badge variant="default" className="text-xs">
                    Disponible
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Próximamente
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-normal">{r.subtitulo}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">{r.descripcion}</p>
              {r.disponible ? (
                <Link
                  href={r.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <FileDown className="h-4 w-4" />
                  Generar reporte
                </Link>
              ) : (
                <span className="text-sm text-slate-400 cursor-not-allowed">No disponible aún</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
