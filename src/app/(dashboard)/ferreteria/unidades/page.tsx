import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Ruler, ArrowRight } from 'lucide-react';
import { getCurrentEmpresa } from '@/lib/auth';
import { buttonVariants } from '@/components/ui/button';

const INDUSTRIAS_FERRETERIA = ['FERRETERIA', 'MATERIALES', 'PINTURAS'];

const UNIDADES_FERRETERIA = [
  { unidad: 'm²', descripcion: 'Metro cuadrado', usos: 'Pisos, paredes, techos' },
  { unidad: 'm³', descripcion: 'Metro cúbico', usos: 'Concreto, tierra, agregados' },
  { unidad: 'kg', descripcion: 'Kilogramo', usos: 'Clavos, tornillos, agregados' },
  { unidad: 'ton', descripcion: 'Tonelada métrica', usos: 'Hierro, acero, cemento a granel' },
  { unidad: 'saco', descripcion: 'Saco (94 lb)', usos: 'Cemento Portland, cal, yeso' },
  { unidad: 'rollo', descripcion: 'Rollo', usos: 'Alambre, malla electrosoldada, cables' },
  { unidad: 'galón', descripcion: 'Galón (3.785 L)', usos: 'Pinturas, diluyentes, selladores' },
  { unidad: 'cubo', descripcion: 'Cubo (pie³)', usos: 'Arena, grava, piedra triturada' },
  { unidad: 'varilla', descripcion: 'Varilla', usos: 'Hierro corrugado, varilla de construcción' },
  { unidad: 'caja', descripcion: 'Caja', usos: 'Cerámicas, porcellanato, piso vinílico' },
  { unidad: 'bolsa', descripcion: 'Bolsa', usos: 'Mortero, repello, arena fina' },
  { unidad: 'und', descripcion: 'Unidad', usos: 'Herramientas, accesorios, varios' },
  { unidad: 'pie', descripcion: 'Pie lineal', usos: 'Madera, tubería PVC, molduras' },
  { unidad: 'lámina', descripcion: 'Lámina', usos: 'Zinc, plywood, Gypsum, PLYCEM' },
];

export default async function UnidadesPage() {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');
  if (!INDUSTRIAS_FERRETERIA.includes(sesion.empresaActiva.industria)) redirect('/dashboard');

  return (
    <div className="p-4 space-y-6 md:p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Unidades de medida</h1>
        <p className="text-slate-500 text-sm mt-1">
          Unidades de medida comunes en el sector ferretero dominicano.
        </p>
      </div>

      {/* Banner de gestión */}
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Ruler className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-900">
              Para gestionar las unidades de medida de tu ferretería, ve a Configuración.
            </p>
            <p className="text-xs text-indigo-700 mt-0.5">
              Puedes crear, editar o desactivar unidades desde el módulo de configuración.
            </p>
          </div>
        </div>
        <Link
          href="/configuracion/unidades-medida"
          className={
            buttonVariants({ variant: 'outline', size: 'sm' }) +
            ' shrink-0 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
          }
        >
          Ir a Configuración
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Link>
      </div>

      {/* Tabla de unidades */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Unidades comunes en ferretería
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-3 font-medium text-slate-600 w-20">Unidad</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Descripción</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Usos típicos</th>
            </tr>
          </thead>
          <tbody>
            {UNIDADES_FERRETERIA.map(({ unidad, descripcion, usos }) => (
              <tr
                key={unidad}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-mono font-bold text-indigo-600">{unidad}</td>
                <td className="px-4 py-3 text-slate-900">{descripcion}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{usos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
