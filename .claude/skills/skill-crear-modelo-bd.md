# Skill: Crear Modelo de Base de Datos

## Cuándo usar
Cuando necesites agregar una nueva entidad al schema de Prisma.

## Pasos

### 1. Agregar el modelo en prisma/schema.prisma

```prisma
model NombreModelo {
  // Campos obligatorios en TODA entidad
  id        String    @id @default(uuid())
  tenantId  String    @map("tenant_id")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Tus campos aquí
  nombre    String
  codigo    String?

  // Relaciones
  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  // Índices obligatorios
  @@index([tenantId])
  @@index([tenantId, deletedAt])

  // Nombre de tabla en snake_case plural
  @@map("nombre_modelos")
}
```

### 2. Crear la migración
```bash
pnpm prisma migrate dev --name add_nombre_modelo
```

### 3. Verificar la migración generada
- Revisar el SQL en `prisma/migrations/[timestamp]_add_nombre_modelo/migration.sql`
- Confirmar que los índices están correctos
- Confirmar que no hay datos que migrar (o agregar el SQL necesario)

### 4. Generar el cliente de Prisma
```bash
pnpm prisma generate
```

### 5. Crear el tipo TypeScript si necesitas extenderlo
```typescript
// src/types/nombre-modelo.ts
import { type NombreModelo } from '@/generated/prisma';

export type NombreModeloConRelaciones = NombreModelo & {
  relacion: OtraEntidad;
};
```

## Checklist
- [ ] `id` como UUID
- [ ] `tenantId` obligatorio
- [ ] `createdAt`, `updatedAt`, `deletedAt` presentes
- [ ] `@@map` con nombre en snake_case plural
- [ ] `@map` en cada campo para mapping a snake_case
- [ ] Índices en `tenantId` y `[tenantId, deletedAt]`
- [ ] Índices adicionales en campos de búsqueda frecuente
- [ ] Migración ejecutada en desarrollo antes de hacer PR
