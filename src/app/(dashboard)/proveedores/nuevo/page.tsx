'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProveedorForm } from '../_components/proveedor-form';

export default function NuevoProveedorPage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/proveedores" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nuevo proveedor</h1>
          <p className="text-slate-500 text-sm mt-0.5">Registra un nuevo proveedor o suplidor</p>
        </div>
      </div>

      <Card className="p-4 md:p-6">
        <ProveedorForm />
      </Card>
    </div>
  );
}
