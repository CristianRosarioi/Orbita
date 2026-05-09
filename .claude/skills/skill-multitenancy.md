# Skill: Multitenancy

## Cuándo usar
En TODAS las operaciones de base de datos y API. El aislamiento de tenants es una regla absoluta.

## Obtener tenantId en API Routes
```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  const { orgId } = await auth();
  // orgId ES el tenantId — viene del token de Clerk, no del body
  if (!orgId) return err('UNAUTHORIZED', 'No autenticado', 401);

  // SIEMPRE filtrar por tenantId
  const items = await prisma.someModel.findMany({
    where: { tenantId: orgId, deletedAt: null },
  });
}
```

## Reglas de Oro

### 1. NUNCA tomar tenantId del request body
```typescript
// ❌ MAL — el cliente puede enviar cualquier tenantId
const { tenantId } = await req.json();

// ✅ BIEN — viene del token de autenticación
const { orgId } = await auth();
const tenantId = orgId;
```

### 2. SIEMPRE verificar ownership antes de retornar un recurso por ID
```typescript
// ❌ MAL — podría retornar datos de otro tenant
const factura = await prisma.invoice.findUnique({ where: { id } });

// ✅ BIEN — verifica que pertenece al tenant
const factura = await prisma.invoice.findFirst({
  where: { id, tenantId: orgId, deletedAt: null },
});
if (!factura) return err('NOT_FOUND', 'Factura no encontrada', 404);
```

### 3. SIEMPRE incluir tenantId en CREATE
```typescript
const item = await prisma.customer.create({
  data: {
    ...parsedData,
    tenantId: orgId, // obligatorio
  },
});
```

### 4. En Server Components
```typescript
import { auth } from '@clerk/nextjs/server';

export async function MiComponente() {
  const { orgId } = await auth();
  if (!orgId) redirect('/sign-in');

  const datos = await prisma.someModel.findMany({
    where: { tenantId: orgId, deletedAt: null },
  });
}
```

## Checklist de Multitenancy
- [ ] `tenantId` extraído de Clerk, no del body
- [ ] Toda query de lectura filtra por `tenantId`
- [ ] Toda query por ID usa `findFirst` con `tenantId`, no `findUnique`
- [ ] Todo `create` incluye `tenantId`
- [ ] Todo `update` verifica `tenantId` en el WHERE
- [ ] Todo `delete` (soft) verifica `tenantId` en el WHERE
