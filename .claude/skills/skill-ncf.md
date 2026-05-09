# Skill: Gestión de NCF (Números de Comprobante Fiscal)

## Cuándo usar
Cuando necesites asignar, validar o anular un NCF en el proceso de facturación.

## Tipos de NCF y cuándo usar cada uno
| Tipo | Código | Usar cuando |
|---|---|---|
| Crédito Fiscal | B01 | El cliente tiene RNC y quiere crédito fiscal |
| Consumidor Final | B02 | Cliente sin RNC o no quiere crédito fiscal |
| Nota de Débito | B03 | Ajuste al alza de una factura existente |
| Nota de Crédito | B04 | Devolución o anulación de factura emitida |
| Gastos Menores | B13 | Compras pequeñas sin comprobante del suplidor |
| Gubernamental | B15 | Ventas al gobierno |
| Exportación | B16 | Ventas al exterior |

## Flujo de asignación de NCF

```typescript
// SIEMPRE usar transacción para evitar duplicados en concurrencia
async function asignarNCF(tenantId: string, tipo: NCFType): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    // 1. Bloquear la secuencia (SELECT ... FOR UPDATE)
    const secuencia = await tx.ncfSequence.findFirst({
      where: {
        tenantId,
        tipo,
        activa: true,
        siguienteNumero: { lte: tx.ncfSequence.fields.hasta },
      },
    });

    if (!secuencia) throw new Error('NCF_SEQUENCE_EXHAUSTED');

    // 2. Construir el NCF
    const numero = secuencia.siguienteNumero.toString().padStart(8, '0');
    const ncf = `${secuencia.serie}${numero}`;

    // 3. Incrementar el contador
    await tx.ncfSequence.update({
      where: { id: secuencia.id },
      data: { siguienteNumero: { increment: 1 } },
    });

    // 4. Registrar el NCF
    await tx.ncfRecord.create({
      data: { tenantId, ncf, tipo, estado: 'PENDIENTE' },
    });

    return ncf;
  });
}
```

## Anulación de NCF (NUNCA modificar la factura original)
```typescript
async function anularFactura(facturaId: string, motivo: string, tenantId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Obtener la factura original
    const factura = await tx.invoice.findFirst({
      where: { id: facturaId, tenantId, deletedAt: null },
    });
    if (!factura) throw new Error('NOT_FOUND');
    if (factura.estado === 'ANULADA') throw new Error('YA_ANULADA');

    // 2. Asignar NCF de nota de crédito (B04)
    const ncfNotaCredito = await asignarNCFEnTransaccion(tx, tenantId, 'B04');

    // 3. Crear la nota de crédito
    const notaCredito = await tx.invoice.create({
      data: {
        tenantId,
        tipo: 'NOTA_CREDITO',
        ncf: ncfNotaCredito,
        ncfAfectado: factura.ncf,
        total: -factura.total,
        motivo,
      },
    });

    // 4. Marcar la factura original como anulada (NO deletedAt)
    await tx.invoice.update({
      where: { id: facturaId },
      data: { estado: 'ANULADA' },
    });

    return notaCredito;
  });
}
```

## Checklist NCF
- [ ] Asignación dentro de transacción Prisma
- [ ] Verificar que la secuencia tiene números disponibles antes de asignar
- [ ] Para B01: validar que el cliente tiene RNC válido
- [ ] Para anulación: crear B04, NO modificar ni borrar la factura original
- [ ] Registrar en `ncf_records` con estado y timestamp
- [ ] Alertar al tenant cuando queden menos del 20% de NCF disponibles
