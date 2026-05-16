import * as XLSX from 'xlsx';

// ---- Types ----

export interface Registro606 {
  rncEmpresa:      string;
  rncComprador:    string;
  tipoNcf:         string;
  ncf:             string;
  ncfModificado:   string;
  fechaComprobante:string; // YYYYMMDD
  fechaPago:       string; // YYYYMMDD
  montoServicios:  number;
  montoBienes:     number;
  total:           number;
  itbisFacturado:  number;
  itbisRetenido:   number;
  itbisPercibido:  number;
  tipoRetencion:   string;
  montoRetencion:  number;
}

export interface Registro607 {
  rncEmpresa:      string;
  rncProveedor:    string;
  tipoNcf:         string;
  ncf:             string;
  ncfModificado:   string;
  fechaComprobante:string;
  fechaPago:       string;
  montoServicios:  number;
  montoBienes:     number;
  total:           number;
  itbisFacturado:  number;
  itbisRetenido:   number;
}

export interface Registro608 {
  rncEmpresa:      string;
  tipoNcf:         string;
  ncf:             string;
  fechaAnulacion:  string;
}

// ---- Helpers ----

function fmtFecha(d: Date | null | undefined): string {
  if (!d) return '';
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}${mm}${dd}`;
}

function fmtMonto(n: number): string {
  return n.toFixed(2);
}

// ---- TXT generators ----

export function generarTXT606(registros: Registro606[]): string {
  const lineas = registros.map((r) =>
    [
      r.rncEmpresa,
      r.rncComprador,
      r.tipoNcf,
      r.ncf,
      r.ncfModificado,
      r.fechaComprobante,
      r.fechaPago,
      fmtMonto(r.montoServicios),
      fmtMonto(r.montoBienes),
      fmtMonto(r.total),
      fmtMonto(r.itbisFacturado),
      fmtMonto(r.itbisRetenido),
      fmtMonto(r.itbisPercibido),
      r.tipoRetencion,
      fmtMonto(r.montoRetencion),
    ].join('|') + '|',
  );
  return lineas.join('\r\n');
}

export function generarTXT607(registros: Registro607[]): string {
  const lineas = registros.map((r) =>
    [
      r.rncEmpresa,
      r.rncProveedor,
      r.tipoNcf,
      r.ncf,
      r.ncfModificado,
      r.fechaComprobante,
      r.fechaPago,
      fmtMonto(r.montoServicios),
      fmtMonto(r.montoBienes),
      fmtMonto(r.total),
      fmtMonto(r.itbisFacturado),
      fmtMonto(r.itbisRetenido),
    ].join('|') + '|',
  );
  return lineas.join('\r\n');
}

export function generarTXT608(registros: Registro608[]): string {
  const lineas = registros.map((r) =>
    [r.rncEmpresa, r.tipoNcf, r.ncf, r.fechaAnulacion].join('|') + '|',
  );
  return lineas.join('\r\n');
}

// ---- Excel generators ----

export function generarExcel606(registros: Registro606[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(
    registros.map((r) => ({
      'RNC Empresa':          r.rncEmpresa,
      'RNC Comprador':        r.rncComprador,
      'Tipo NCF':             r.tipoNcf,
      'NCF':                  r.ncf,
      'NCF Modificado':       r.ncfModificado,
      'Fecha Comprobante':    r.fechaComprobante,
      'Fecha Pago':           r.fechaPago,
      'Monto Servicios':      r.montoServicios,
      'Monto Bienes':         r.montoBienes,
      'Total':                r.total,
      'ITBIS Facturado':      r.itbisFacturado,
      'ITBIS Retenido':       r.itbisRetenido,
      'ITBIS Percibido':      r.itbisPercibido,
      'Tipo Retención':       r.tipoRetencion,
      'Monto Retención':      r.montoRetencion,
    })),
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte 606');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function generarExcel607(registros: Registro607[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(
    registros.map((r) => ({
      'RNC Empresa':       r.rncEmpresa,
      'RNC Proveedor':     r.rncProveedor,
      'Tipo NCF':          r.tipoNcf,
      'NCF':               r.ncf,
      'NCF Modificado':    r.ncfModificado,
      'Fecha Comprobante': r.fechaComprobante,
      'Fecha Pago':        r.fechaPago,
      'Monto Servicios':   r.montoServicios,
      'Monto Bienes':      r.montoBienes,
      'Total':             r.total,
      'ITBIS Facturado':   r.itbisFacturado,
      'ITBIS Retenido':    r.itbisRetenido,
    })),
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte 607');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function generarExcel608(registros: Registro608[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(
    registros.map((r) => ({
      'RNC Empresa':    r.rncEmpresa,
      'Tipo NCF':       r.tipoNcf,
      'NCF':            r.ncf,
      'Fecha Anulación':r.fechaAnulacion,
    })),
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte 608');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

// ---- Mapping helpers: Factura → Registro ----

interface FacturaParaReporte {
  numero:             string;
  clienteIdentificacion: string | null;
  clienteNombre:      string;
  fechaEmision:       Date;
  updatedAt:          Date;
  subtotal:           unknown;
  itbis:              unknown;
  total:              unknown;
  metodoPago:         string;
  estado:             string;
  items:              Array<{ producto?: { tipo: string } | null; subtotal: unknown }>;
}

export function facturaA606(factura: FacturaParaReporte, rncEmpresa: string): Registro606 {
  let montoServicios = 0;
  let montoBienes = 0;
  for (const item of factura.items) {
    const sub = Number(item.subtotal);
    if (item.producto?.tipo === 'SERVICIO') montoServicios += sub;
    else montoBienes += sub;
  }

  return {
    rncEmpresa,
    rncComprador:     factura.clienteIdentificacion ?? '',
    tipoNcf:          'B02', // default consumidor final — se reemplazará cuando se implemente NCF
    ncf:              factura.numero,
    ncfModificado:    '',
    fechaComprobante: fmtFecha(factura.fechaEmision),
    fechaPago:        fmtFecha(factura.updatedAt),
    montoServicios,
    montoBienes,
    total:            Number(factura.total),
    itbisFacturado:   Number(factura.itbis),
    itbisRetenido:    0,
    itbisPercibido:   0,
    tipoRetencion:    '',
    montoRetencion:   0,
  };
}

export function facturaA608(factura: FacturaParaReporte, rncEmpresa: string): Registro608 {
  return {
    rncEmpresa,
    tipoNcf:      'B02',
    ncf:          factura.numero,
    fechaAnulacion: fmtFecha(factura.updatedAt),
  };
}
