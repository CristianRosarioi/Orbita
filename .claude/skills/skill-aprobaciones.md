# Skill: Flujo de Aprobaciones

## Cuándo usar
Para documentos que requieren aprobación antes de ser efectivos:
- Cotización → Orden de Compra → Factura
- Solicitud de crédito a cliente
- Ajuste de inventario
- Descuentos especiales (superiores al límite del rol)
- Pago a suplidor

## Estados de un documento con aprobación
```typescript
type EstadoDocumento =
  | 'BORRADOR'      // Creado, no enviado
  | 'PENDIENTE'     // Enviado para aprobación
  | 'APROBADO'      // Aprobado, listo para ejecutar
  | 'RECHAZADO'     // Rechazado (requiere motivo)
  | 'EJECUTADO'     // Convertido en acción real (ej: cotización → factura)
  | 'CANCELADO'     // Cancelado antes de aprobación
  | 'VENCIDO';      // Pasó el tiempo límite sin aprobación
```

## Flujo típico: Cotización → Factura
```
BORRADOR → [usuario crea y edita]
PENDIENTE → [usuario envía al cliente/supervisor para aprobación]
APROBADO → [cliente/supervisor aprueba]
EJECUTADO → [se convierte en factura con NCF]
```

## Implementación de la transición de estado
```typescript
async function aprobarDocumento(
  documentoId: string,
  aprobadorId: string,
  tenantId: string,
  comentario?: string
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Obtener y validar el documento
    const documento = await tx.quote.findFirst({
      where: { id: documentoId, tenantId, deletedAt: null },
    });
    if (!documento) throw new Error('NOT_FOUND');
    if (documento.estado !== 'PENDIENTE') throw new Error('ESTADO_INVALIDO');

    // 2. Verificar que el aprobador tiene permisos
    // (el role check ya debe haberse hecho en el endpoint)

    // 3. Actualizar estado con auditoría
    const aprobado = await tx.quote.update({
      where: { id: documentoId },
      data: {
        estado: 'APROBADO',
        aprobadoPor: aprobadorId,
        aprobadoEn: new Date(),
        comentarioAprobacion: comentario,
      },
    });

    // 4. Registrar en audit log
    await tx.auditLog.create({
      data: {
        tenantId,
        entidad: 'Quote',
        entidadId: documentoId,
        accion: 'APROBACION',
        realizadoPor: aprobadorId,
        detalles: { estadoAnterior: 'PENDIENTE', estadoNuevo: 'APROBADO', comentario },
      },
    });

    return aprobado;
  });
}
```

## Conversión de Cotización a Factura
```typescript
async function convertirCotizacionAFactura(cotizacionId: string, orgId: string) {
  return await prisma.$transaction(async (tx) => {
    const cotizacion = await tx.quote.findFirst({
      where: { id: cotizacionId, tenantId: orgId, estado: 'APROBADO' },
      include: { items: true },
    });
    if (!cotizacion) throw new Error('Cotización no encontrada o no aprobada');

    // Asignar NCF según el tipo de cliente
    const tipoNcf = cotizacion.clienteTieneRNC ? 'B01' : 'B02';
    const ncf = await asignarNCFEnTransaccion(tx, orgId, tipoNcf);

    // Crear factura
    const factura = await tx.invoice.create({ data: { ...facturaData, ncf } });

    // Marcar cotización como ejecutada
    await tx.quote.update({
      where: { id: cotizacionId },
      data: { estado: 'EJECUTADO', facturaId: factura.id },
    });

    return factura;
  });
}
```

## Checklist de Aprobaciones
- [ ] Estados definidos como enum en Prisma
- [ ] Transiciones de estado validadas (no puede ir de BORRADOR a EJECUTADO directo)
- [ ] Registro en audit log de cada transición
- [ ] Notificación al aprobador cuando hay algo pendiente (en Fase 8)
- [ ] Expiración automática de documentos viejos (cron job)
- [ ] Historial de estados visible en la UI
