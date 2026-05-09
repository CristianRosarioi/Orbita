# Skill: Transacciones de Base de Datos

## Cuándo usar
Cuando una operación de negocio requiere modificar múltiples tablas de forma atómica.

## Casos obligatorios (SIEMPRE con transacción)
- Crear una factura con sus items y NCF
- Anular una factura (factura + nota de crédito)
- Asignar NCF (secuencia + registro)
- Ajustar inventario (movimiento + stock)
- Registrar un pago (pago + actualizar estado factura)
- Crear orden de compra con items

## Patrón básico
```typescript
const resultado = await prisma.$transaction(async (tx) => {
  // Usar 'tx' en lugar de 'prisma' dentro de la transacción
  const factura = await tx.invoice.create({ data: facturaData });

  for (const item of items) {
    await tx.invoiceItem.create({
      data: { ...item, invoiceId: factura.id, tenantId: orgId },
    });
  }

  // Actualizar inventario
  await tx.product.update({
    where: { id: item.productId, tenantId: orgId },
    data: { stock: { decrement: item.cantidad } },
  });

  return factura;
});
```

## Transacción con timeout personalizado
```typescript
const resultado = await prisma.$transaction(
  async (tx) => {
    // operaciones largas...
  },
  {
    maxWait: 5000,  // Esperar máximo 5s para adquirir la transacción
    timeout: 30000, // Timeout de 30s para completar
  }
);
```

## Manejo de errores en transacciones
```typescript
try {
  const resultado = await prisma.$transaction(async (tx) => {
    // Si cualquier línea lanza un error, todo hace rollback automáticamente
    const factura = await tx.invoice.create({ data });
    const ncf = await asignarNCFEnTransaccion(tx, tenantId, tipo);
    // ...
    return { factura, ncf };
  });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return err('DUPLICATE', 'Ya existe un registro con esos datos', 409);
    }
  }
  throw error; // re-throw para logging
}
```

## Checklist de Transacciones
- [ ] Usar `tx` (no `prisma`) dentro de la transacción
- [ ] Todo el bloque en un solo `$transaction()`
- [ ] Manejo de errores con try/catch fuera de la transacción
- [ ] Timeout configurado para operaciones largas
- [ ] No hacer llamadas a APIs externas dentro de la transacción
- [ ] El rollback es automático si cualquier operación falla
