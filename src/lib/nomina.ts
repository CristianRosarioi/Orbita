// Cálculos de nómina dominicana — TSS e ISR vigentes 2026
// Fuente: TSS (Ley 87-01) e ISR (Ley 11-92 con actualización 2024)

// ── TSS 2026 ──────────────────────────────────────────────────────────────
// Tope cotizable mensual TSS: RD$ 118,656.00 (ajustado anualmente por el BC)
const TOPE_TSS_MENSUAL = 118_656;

// Porcentajes de cotización según Ley 87-01
const TSS_TRABAJADOR = {
  SFS: 0.0304, // Seguro Familiar de Salud — trabajador
  AFP: 0.0287, // Pensión — trabajador
};
const TSS_EMPLEADOR = {
  SFS: 0.0709, // Seguro Familiar de Salud — empleador
  AFP: 0.071, // Pensión — empleador
  SRL: 0.011, // Seguro de Riesgos Laborales
};

export const TASA_TSS_TRABAJADOR = TSS_TRABAJADOR.SFS + TSS_TRABAJADOR.AFP; // 5.91%
export const TASA_TSS_EMPLEADOR = TSS_EMPLEADOR.SFS + TSS_EMPLEADOR.AFP + TSS_EMPLEADOR.SRL; // 15.29% (≈)

// ── ISR 2026 — Tabla progresiva anual (Art. 296 Código Tributario) ──────────
// Exento hasta: RD$ 416,220.00 anuales
// Los montos de salario anual gravable (después de exento y TSS)

const TRAMOS_ISR = [
  { desde: 0, hasta: 416_220.0, tasa: 0, cuota: 0 },
  { desde: 416_220.01, hasta: 624_329.0, tasa: 0.15, cuota: 0 },
  { desde: 624_329.01, hasta: 867_123.0, tasa: 0.2, cuota: 31_216.0 },
  { desde: 867_123.01, hasta: Infinity, tasa: 0.25, cuota: 79_776.0 },
];

function calcularISRAnual(salarioAnualGravable: number): number {
  for (const tramo of TRAMOS_ISR) {
    if (salarioAnualGravable <= tramo.hasta) {
      const exceso = Math.max(0, salarioAnualGravable - tramo.desde);
      return tramo.cuota + exceso * tramo.tasa;
    }
  }
  return 0;
}

// ── Interfaces ────────────────────────────────────────────────────────────

export interface InputItemNomina {
  salarioBase: number;
  diasTrabajados?: number; // default 23.83 (mes completo)
  otrosIngresos?: number; // bonificaciones, horas extra, etc.
  otrosDescuentos?: number; // descuentos varios
}

export interface ResultadoItemNomina {
  salarioBase: number;
  diasTrabajados: number;
  salarioBruto: number; // proporcional a días trabajados + otros ingresos
  tssTrabajador: number; // descuento al trabajador
  tssEmpleador: number; // costo adicional del empleador
  isr: number; // retención ISR mensual
  otrosDescuentos: number;
  otrosIngresos: number;
  salarioNeto: number; // lo que recibe el trabajador
}

export interface ResumenNomina {
  totalBruto: number;
  totalTSS: number; // suma de TSS trabajadores
  totalISR: number;
  totalOtros: number; // suma de otros descuentos
  totalNeto: number;
}

// ── Cálculo individual ────────────────────────────────────────────────────

export function calcularItemNomina(input: InputItemNomina): ResultadoItemNomina {
  const { salarioBase, diasTrabajados = 23.83, otrosIngresos = 0, otrosDescuentos = 0 } = input;

  // Salario proporcional a días trabajados (base: 23.83 días/mes)
  const salarioProporcional = (salarioBase / 23.83) * diasTrabajados;
  const salarioBruto = round2(salarioProporcional + otrosIngresos);

  // TSS se calcula sobre la base hasta el tope (mensual)
  const baseParaTSS = Math.min(salarioBruto, TOPE_TSS_MENSUAL);
  const tssTrabajador = round2(baseParaTSS * TASA_TSS_TRABAJADOR);
  const tssEmpleador = round2(baseParaTSS * TASA_TSS_EMPLEADOR);

  // ISR: base gravable = salarioBruto - TSS trabajador
  // Se proyecta anualmente, calcula ISR anual y divide entre 12
  const salarioAnualGravable = (salarioBruto - tssTrabajador) * 12;
  const isrAnual = calcularISRAnual(salarioAnualGravable);
  const isr = round2(isrAnual / 12);

  const salarioNeto = round2(salarioBruto - tssTrabajador - isr - otrosDescuentos);

  return {
    salarioBase,
    diasTrabajados,
    salarioBruto,
    tssTrabajador,
    tssEmpleador,
    isr,
    otrosDescuentos,
    otrosIngresos,
    salarioNeto,
  };
}

// ── Resumen de nómina ─────────────────────────────────────────────────────

export function calcularNomina(items: ResultadoItemNomina[]): ResumenNomina {
  const totalBruto = round2(items.reduce((s, i) => s + i.salarioBruto, 0));
  const totalTSS = round2(items.reduce((s, i) => s + i.tssTrabajador, 0));
  const totalISR = round2(items.reduce((s, i) => s + i.isr, 0));
  const totalOtros = round2(items.reduce((s, i) => s + i.otrosDescuentos, 0));
  const totalNeto = round2(items.reduce((s, i) => s + i.salarioNeto, 0));

  return { totalBruto, totalTSS, totalISR, totalOtros, totalNeto };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
