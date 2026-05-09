# Skill: Crear Endpoint API

## Cuándo usar
Cuando necesites crear un nuevo endpoint en `src/app/api/`.

## Pasos

### 1. Crear el archivo de ruta
```
src/app/api/[recurso]/route.ts          # CRUD básico (GET, POST)
src/app/api/[recurso]/[id]/route.ts     # Por ID (GET, PUT, DELETE)
```

### 2. Estructura base obligatoria
```typescript
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Schema de validación
const CreateXxxSchema = z.object({
  campo: z.string().min(1),
});

// Helpers de respuesta (importar de @/lib/api-response cuando exista)
function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
function err(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function GET(req: NextRequest) {
  const { orgId } = await auth();
  if (!orgId) return err('UNAUTHORIZED', 'No autenticado', 401);

  // Paginación
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.xxx.findMany({
      where: { tenantId: orgId, deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.xxx.count({ where: { tenantId: orgId, deletedAt: null } }),
  ]);

  return ok(items, 200);
}

export async function POST(req: NextRequest) {
  const { orgId } = await auth();
  if (!orgId) return err('UNAUTHORIZED', 'No autenticado', 401);

  const body = await req.json().catch(() => null);
  if (!body) return err('INVALID_BODY', 'Body inválido', 400);

  const parsed = CreateXxxSchema.safeParse(body);
  if (!parsed.success) {
    return err('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
  }

  const item = await prisma.xxx.create({
    data: { ...parsed.data, tenantId: orgId },
  });

  return ok(item, 201);
}
```

### 3. Checklist antes de terminar
- [ ] `tenantId` se extrae de Clerk, nunca del body
- [ ] Validación con Zod en todo endpoint que recibe datos
- [ ] Respuesta usa formato `{ success, data/error }`
- [ ] `deletedAt: null` en todos los filtros de consulta
- [ ] Paginación en GET de listas
- [ ] Límite máximo de 100 registros por página
