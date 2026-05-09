# Skill: Generar PDF

## Cuándo usar
Cuando necesites generar un PDF de factura, reporte, cotización u otro documento.

## Arquitectura por entorno

### Desarrollo local
```
API Route → PuppeteerService.generate(templateName, data) → Buffer → Response
```

### Producción
```
API Route → SQS message → Lambda → Puppeteer → S3 upload → Pre-signed URL
```

## Pasos para crear un nuevo template

### 1. Crear template HTML en src/lib/pdf/templates/
```typescript
// src/lib/pdf/templates/factura.ts
export function facturaTemplate(data: FacturaPDFData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        /* Estilos inline para compatibilidad con Puppeteer */
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; }
        .ncf { font-size: 14px; font-weight: bold; color: #333; }
        /* ... */
      </style>
    </head>
    <body>
      <div class="header">
        <div class="empresa">
          <h1>${data.empresa.nombre}</h1>
          <p>RNC: ${data.empresa.rnc}</p>
        </div>
        <div class="ncf-box">
          <p class="ncf">NCF: ${data.ncf}</p>
          <p>Fecha: ${formatearFecha(data.fecha)}</p>
        </div>
      </div>
      <!-- ... resto del template -->
    </body>
    </html>
  `;
}
```

### 2. Definir el tipo de datos del template
```typescript
// src/lib/pdf/types.ts
export interface FacturaPDFData {
  empresa: { nombre: string; rnc: string; logo?: string };
  ncf: string;
  fecha: Date;
  cliente: { nombre: string; rnc?: string };
  items: Array<{ descripcion: string; cantidad: number; precio: number; itbis: number }>;
  subtotal: number;
  totalItbis: number;
  total: number;
}
```

### 3. Llamar desde el endpoint
```typescript
// src/app/api/facturas/[id]/pdf/route.ts
import { generatePDF } from '@/lib/pdf/generate';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { orgId } = await auth();
  if (!orgId) return err('UNAUTHORIZED', 'No autenticado', 401);

  const factura = await prisma.invoice.findFirst({
    where: { id: params.id, tenantId: orgId, deletedAt: null },
    include: { items: true, customer: true, tenant: true },
  });

  if (!factura) return err('NOT_FOUND', 'Factura no encontrada', 404);

  const pdfBuffer = await generatePDF('factura', mapFacturaToPDFData(factura));

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${factura.ncf}.pdf"`,
    },
  });
}
```

## Checklist
- [ ] Template usa estilos inline (no clases externas)
- [ ] Datos del tenant verificados antes de generar
- [ ] Fecha en formato DD/MM/YYYY
- [ ] Moneda con símbolo "RD$" o "DOP"
- [ ] NCF visible y correcto
- [ ] No se generan PDFs con datos de otro tenant
