# Skill: Soft Delete

## Cuándo usar
En TODAS las operaciones de eliminación. Nunca usar DELETE en la base de datos.

## Regla absoluta
> "Si un dato fue alguna vez real para el negocio (cliente, factura, producto, etc.),
>  no se borra — se marca como eliminado con `deletedAt`."

## Implementación

### En Prisma (campo en schema)
```prisma
model Customer {
  // ...
  deletedAt DateTime? @map("deleted_at")
  // ...
}
```

### Operación de soft delete
```typescript
// ❌ MAL — elimina el registro permanentemente
await prisma.customer.delete({ where: { id } });

// ✅ BIEN — marca como eliminado
await prisma.customer.update({
  where: { id, tenantId: orgId },
  data: { deletedAt: new Date() },
});
```

### Filtrar registros activos (siempre)
```typescript
// ✅ SIEMPRE incluir deletedAt: null en queries de lectura
const clientes = await prisma.customer.findMany({
  where: {
    tenantId: orgId,
    deletedAt: null,  // <- esto filtra los eliminados
  },
});
```

### Verificar antes de eliminar
```typescript
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { orgId } = await auth();
  if (!orgId) return err('UNAUTHORIZED', 'No autenticado', 401);

  // 1. Verificar que existe y pertenece al tenant
  const cliente = await prisma.customer.findFirst({
    where: { id: params.id, tenantId: orgId, deletedAt: null },
  });
  if (!cliente) return err('NOT_FOUND', 'Cliente no encontrado', 404);

  // 2. Verificar que no tiene dependencias activas
  const facturaActiva = await prisma.invoice.findFirst({
    where: { customerId: params.id, tenantId: orgId, deletedAt: null },
  });
  if (facturaActiva) {
    return err('HAS_DEPENDENCIES', 'El cliente tiene facturas activas', 409);
  }

  // 3. Soft delete
  await prisma.customer.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return ok({ message: 'Cliente eliminado correctamente' });
}
```

## Casos especiales — lo que NO se puede eliminar (ni soft delete)
- NCF emitidos — son parte del registro fiscal
- Facturas emitidas — solo se anulan con nota de crédito
- Períodos fiscales cerrados
- Registros de auditoría

## Checklist
- [ ] `deletedAt` en el schema del modelo
- [ ] Usar `update({ data: { deletedAt: new Date() } })` en lugar de `delete()`
- [ ] `deletedAt: null` en todas las queries de lectura
- [ ] Verificar dependencias antes de soft delete
- [ ] Manejar el caso donde el registro ya está eliminado (idempotente)
