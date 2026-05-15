import { jsPDF } from 'jspdf';

interface ItemTicket {
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface EmpresaTicket {
  nombre: string;
  nombreComercial: string | null;
  telefono: string | null;
  direccion: string | null;
  modoFiscal?: string;
}

interface FacturaTicket {
  numero: string;
  fechaEmision: Date | string;
  metodoPago: string;
  subtotal: number;
  itbis: number;
  descuento: number;
  total: number;
  clienteNombre: string;
  items: ItemTicket[];
  montoRecibido?: number;
}

const METODO_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE: 'Cheque',
  CREDITO: 'Crédito',
};

function fmt(n: number): string {
  return new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

// Ancho de ticket térmico estándar 80mm ≈ 226pt en jsPDF
const PAGE_W = 80; // mm
const MARGIN = 5;
const LINE_H = 4.5;
const CONTENT_W = PAGE_W - MARGIN * 2;

export function generarTicketPOS(factura: FacturaTicket, empresa: EmpresaTicket): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [PAGE_W, 297], // altura dinámica — cortamos al final
  });

  doc.setFont('helvetica');

  let y = MARGIN;

  const line = (text: string, align: 'left' | 'center' | 'right' = 'left', bold = false, size = 8) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const x = align === 'center' ? PAGE_W / 2 : align === 'right' ? PAGE_W - MARGIN : MARGIN;
    doc.text(text, x, y, { align });
    y += LINE_H;
  };

  const divider = () => {
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 2;
  };

  // ---- Header ----
  const nombreEmpresa = empresa.nombreComercial ?? empresa.nombre;
  line(nombreEmpresa, 'center', true, 10);
  if (empresa.telefono) line(`Tel: ${empresa.telefono}`, 'center');
  if (empresa.direccion) {
    const lines = doc.splitTextToSize(empresa.direccion, CONTENT_W) as string[];
    lines.forEach((l: string) => line(l, 'center'));
  }

  y += 1;
  divider();

  const fecha = new Date(factura.fechaEmision);
  const fechaStr = fecha.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaStr = fecha.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
  line(`Fecha: ${fechaStr}  Hora: ${horaStr}`);
  line(`Factura: ${factura.numero}`, 'left', true);
  line(`Cliente: ${factura.clienteNombre}`);

  divider();

  // ---- Items ----
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Descripción', MARGIN, y);
  doc.text('Cant', MARGIN + 40, y, { align: 'right' });
  doc.text('P.Unit', MARGIN + 55, y, { align: 'right' });
  doc.text('Total', PAGE_W - MARGIN, y, { align: 'right' });
  y += LINE_H;
  doc.setFont('helvetica', 'normal');

  for (const item of factura.items) {
    // Nombre puede ser largo — truncar o dividir
    const nombre = item.productoNombre.length > 22 ? item.productoNombre.slice(0, 22) + '…' : item.productoNombre;
    doc.setFontSize(7.5);
    doc.text(nombre, MARGIN, y);
    doc.text(String(item.cantidad), MARGIN + 40, y, { align: 'right' });
    doc.text(fmt(item.precioUnitario), MARGIN + 55, y, { align: 'right' });
    doc.text(fmt(item.total), PAGE_W - MARGIN, y, { align: 'right' });
    y += LINE_H;
  }

  divider();

  // ---- Totales ----
  const totRow = (label: string, val: string, bold = false) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, PAGE_W - MARGIN - 30, y);
    doc.text(`RD$ ${val}`, PAGE_W - MARGIN, y, { align: 'right' });
    y += LINE_H;
  };

  totRow('Subtotal:', fmt(factura.subtotal));
  if (factura.itbis > 0) totRow('ITBIS (18%):', fmt(factura.itbis));
  if (factura.descuento > 0) totRow('Descuento:', `-${fmt(factura.descuento)}`);
  totRow('TOTAL:', fmt(factura.total), true);

  if (factura.metodoPago === 'EFECTIVO' && factura.montoRecibido !== undefined) {
    const cambio = factura.montoRecibido - factura.total;
    totRow('Recibido:', fmt(factura.montoRecibido));
    totRow('Cambio:', fmt(Math.max(0, cambio)));
  }

  y += 1;
  line(`Método de pago: ${METODO_LABELS[factura.metodoPago] ?? factura.metodoPago}`);

  divider();

  // ---- Footer ----
  line('¡Gracias por su compra!', 'center', true, 9);

  if (empresa.modoFiscal === 'SIMPLE') {
    y += 1;
    line('Modo Simple — Sin valor fiscal', 'center', false, 7);
  }

  y += 3;

  // jsPDF no soporta recorte dinámico — la impresora térmica ignora el espacio en blanco
  return doc.output('blob');
}
