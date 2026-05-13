'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ChefHat,
  ShoppingCart,
  Car,
  Wrench,
  Hammer,
  Scissors,
  Stethoscope,
  Building,
  Pill,
  Shirt,
  Globe,
  Gem,
  Package,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { CreateEmpresaSchema, type CreateEmpresaInput } from '@/lib/validations/empresas';
import { Industria, ModoFiscal } from '@/types/enums';

// ============================================================
// Configuración de industrias con iconos
// ============================================================
const INDUSTRIAS: {
  valor: Industria;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { valor: Industria.RESTAURANTE, label: 'Restaurante', icon: ChefHat },
  { valor: Industria.COLMADO, label: 'Colmado/Supermercado', icon: ShoppingCart },
  { valor: Industria.CARWASH, label: 'Car Wash', icon: Car },
  { valor: Industria.REPUESTOS, label: 'Repuestos', icon: Car },
  { valor: Industria.TALLER_MECANICO, label: 'Taller Mecánico', icon: Wrench },
  { valor: Industria.FERRETERIA, label: 'Ferretería', icon: Hammer },
  { valor: Industria.SALON_BARBERIA, label: 'Salón / Barbería', icon: Scissors },
  { valor: Industria.CLINICA, label: 'Clínica / Salud', icon: Stethoscope },
  { valor: Industria.INMOBILIARIA, label: 'Inmobiliaria', icon: Building },
  { valor: Industria.FARMACIA, label: 'Farmacia', icon: Pill },
  { valor: Industria.TIENDA_ROPA, label: 'Tienda de Ropa', icon: Shirt },
  { valor: Industria.TIENDA_ONLINE, label: 'Tienda Online', icon: Globe },
  { valor: Industria.JOYERIA, label: 'Joyería', icon: Gem },
  { valor: Industria.OTRO, label: 'Otro tipo', icon: Package },
];

const PASOS = ['Tu empresa', 'Tipo de negocio', 'Modo fiscal'];

// ============================================================
// Componente principal del wizard
// ============================================================
export function OnboardingWizard() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateEmpresaInput>({
    resolver: zodResolver(CreateEmpresaSchema),
    defaultValues: {
      nombre: '',
      nombreComercial: '',
      modoFiscal: ModoFiscal.SIMPLE,
    },
    mode: 'onChange',
  });

  const {
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form;
  const industriaSeleccionada = watch('industria');
  const modoFiscalSeleccionado = watch('modoFiscal');

  // Validar campos del paso actual antes de avanzar
  async function avanzar() {
    if (paso === 0) {
      const ok = await form.trigger(['nombre', 'nombreComercial', 'telefono', 'direccion']);
      if (!ok) return;
    }
    if (paso === 1) {
      const ok = await form.trigger(['industria']);
      if (!ok) return;
    }
    setPaso((p) => Math.min(p + 1, 2));
  }

  async function handleSubmit() {
    const valid = await form.trigger();
    if (!valid) return;

    const data = getValues();
    setIsLoading(true);

    try {
      const res = await fetch('/api/empresas/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resultado = await res.json();

      if (!resultado.success) {
        toast.error(resultado.error?.message ?? 'No pudimos crear tu empresa. Inténtalo de nuevo.');
        return;
      }

      toast.success('¡Empresa creada! Te damos la bienvenida a Órbita.');
      router.push('/dashboard');
    } catch {
      toast.error('No pudimos conectar con el servidor. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <StepIndicator pasoActual={paso} pasos={PASOS} />

      {/* Contenido del paso */}
      <Card className="p-6">
        {paso === 0 && <PasoInfoBasica form={form} errors={errors} />}
        {paso === 1 && (
          <PasoIndustria
            industriaSeleccionada={industriaSeleccionada}
            onSeleccionar={(ind) => setValue('industria', ind, { shouldValidate: true })}
            error={errors.industria?.message}
          />
        )}
        {paso === 2 && (
          <PasoModoFiscal
            modoSeleccionado={modoFiscalSeleccionado}
            onSeleccionar={(modo) => setValue('modoFiscal', modo, { shouldValidate: true })}
            form={form}
            errors={errors}
          />
        )}
      </Card>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setPaso((p) => Math.max(p - 1, 0))}
          disabled={paso === 0 || isLoading}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Atrás
        </Button>

        {paso < 2 ? (
          <Button onClick={avanzar} className="gap-1 bg-slate-900 hover:bg-slate-700">
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="gap-1 bg-slate-900 hover:bg-slate-700 min-w-36"
          >
            {isLoading ? (
              'Creando...'
            ) : (
              <>
                Crear empresa <CheckCircle className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Componente: Indicador de pasos
// ============================================================
function StepIndicator({ pasoActual, pasos }: { pasoActual: number; pasos: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {pasos.map((nombre, i) => (
        <div key={nombre} className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < pasoActual
                  ? 'bg-green-500 text-white'
                  : i === pasoActual
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i < pasoActual ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                i === pasoActual ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {nombre}
            </span>
          </div>
          {i < pasos.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Paso 1 — Información básica
// ============================================================
function PasoInfoBasica({
  form,
  errors,
}: {
  form: ReturnType<typeof useForm<CreateEmpresaInput>>;
  errors: ReturnType<typeof useForm<CreateEmpresaInput>>['formState']['errors'];
}) {
  const { register } = form;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Información de tu empresa</h2>
        <p className="text-slate-500 text-sm mt-1">
          Puedes cambiar estos datos después en Configuración.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">
            Nombre de la empresa <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nombre"
            placeholder="Ej. Distribuidora El Caribe, S.R.L."
            {...register('nombre')}
            className={errors.nombre ? 'border-red-300' : ''}
          />
          {errors.nombre && <p className="text-red-500 text-xs">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nombreComercial">Nombre comercial</Label>
          <Input
            id="nombreComercial"
            placeholder="Ej. El Caribe (como aparece en facturas)"
            {...register('nombreComercial')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" placeholder="809-000-0000" {...register('telefono')} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            placeholder="Calle, No., Sector, Provincia"
            {...register('direccion')}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Paso 2 — Selección de industria
// ============================================================
function PasoIndustria({
  industriaSeleccionada,
  onSeleccionar,
  error,
}: {
  industriaSeleccionada?: string;
  onSeleccionar: (ind: Industria) => void;
  error?: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">¿Qué tipo de negocio tienes?</h2>
        <p className="text-slate-500 text-sm mt-1">Órbita adapta la interfaz según tu industria.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {INDUSTRIAS.map(({ valor, label, icon: Icon }) => (
          <button
            key={valor}
            type="button"
            onClick={() => onSeleccionar(valor)}
            className={`flex items-center gap-2.5 p-3 rounded-lg border text-left text-sm font-medium transition-all ${
              industriaSeleccionada === valor
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

// ============================================================
// Paso 3 — Modo fiscal
// ============================================================
function PasoModoFiscal({
  modoSeleccionado,
  onSeleccionar,
  form,
  errors,
}: {
  modoSeleccionado?: string;
  onSeleccionar: (modo: ModoFiscal) => void;
  form: ReturnType<typeof useForm<CreateEmpresaInput>>;
  errors: ReturnType<typeof useForm<CreateEmpresaInput>>['formState']['errors'];
}) {
  const { register } = form;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">¿Cómo quieres facturar?</h2>
        <p className="text-slate-500 text-sm mt-1">Puedes cambiar esto después en Configuración.</p>
      </div>

      <div className="space-y-3">
        {/* Modo Simple */}
        <button
          type="button"
          onClick={() => onSeleccionar(ModoFiscal.SIMPLE)}
          className={`w-full p-4 rounded-lg border text-left transition-all ${
            modoSeleccionado === ModoFiscal.SIMPLE
              ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900'
              : 'border-slate-200 bg-white hover:border-slate-400'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                modoSeleccionado === ModoFiscal.SIMPLE
                  ? 'border-slate-900 bg-slate-900'
                  : 'border-slate-300'
              }`}
            >
              {modoSeleccionado === ModoFiscal.SIMPLE && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Modo Simple</p>
              <p className="text-slate-500 text-xs mt-1">
                Factura sin NCF ni comprobantes fiscales. Ideal si estás comenzando, no tienes RNC
                todavía, o eres un negocio informal.
              </p>
            </div>
          </div>
        </button>

        {/* Modo Fiscal */}
        <button
          type="button"
          onClick={() => onSeleccionar(ModoFiscal.FISCAL)}
          className={`w-full p-4 rounded-lg border text-left transition-all ${
            modoSeleccionado === ModoFiscal.FISCAL
              ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900'
              : 'border-slate-200 bg-white hover:border-slate-400'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                modoSeleccionado === ModoFiscal.FISCAL
                  ? 'border-slate-900 bg-slate-900'
                  : 'border-slate-300'
              }`}
            >
              {modoSeleccionado === ModoFiscal.FISCAL && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                Modo Fiscal{' '}
                <span className="text-xs font-normal text-slate-500">(cumplimiento DGII)</span>
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Facturas con NCF, ITBIS, reportes 606/607. Requieres RNC vigente. Puedes activar la
                facturación electrónica (e-CF) más adelante.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Campo RNC — solo visible en modo fiscal */}
      {modoSeleccionado === ModoFiscal.FISCAL && (
        <div className="space-y-1.5 pt-1">
          <Label htmlFor="rnc">
            RNC <span className="text-red-500">*</span>
          </Label>
          <Input
            id="rnc"
            placeholder="000000000 (9 dígitos)"
            maxLength={11}
            {...register('rnc')}
            className={errors.rnc ? 'border-red-300' : ''}
          />
          {errors.rnc ? (
            <p className="text-red-500 text-xs">{errors.rnc.message}</p>
          ) : (
            <p className="text-slate-400 text-xs">
              Encontrarás tu RNC en tu certificado de registro mercantil o en dgii.gov.do.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
