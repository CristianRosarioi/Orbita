# Skill: Crear Componente UI

## Cuándo usar
Cuando necesites crear un nuevo componente de React para la UI de Órbita.

## Dónde colocar
```
src/components/ui/           → componentes base (shadcn/ui)
src/components/shared/       → componentes compartidos entre módulos
src/components/layout/       → sidebar, header, navegación
src/components/modules/[X]/  → componentes específicos del módulo X
```

## Decisión: Server Component vs Client Component

### Usar Server Component (sin 'use client') cuando:
- Solo muestra datos (no necesita estado local)
- Hace fetch de datos directamente
- No tiene event handlers
- No usa hooks de React

### Usar Client Component ('use client') cuando:
- Necesita useState, useEffect, u otros hooks
- Tiene event handlers (onClick, onChange)
- Usa APIs del browser (localStorage, etc.)
- Usa animaciones o transiciones complejas

## Patrón recomendado

### Server Component con datos
```typescript
// src/components/modules/clientes/tabla-clientes.tsx
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { TablaClientesUI } from './tabla-clientes-ui';

export async function TablaClientes() {
  const { orgId } = await auth();
  const clientes = await prisma.customer.findMany({
    where: { tenantId: orgId!, deletedAt: null },
    orderBy: { nombre: 'asc' },
  });
  return <TablaClientesUI clientes={clientes} />;
}
```

### Client Component (UI interactiva)
```typescript
'use client';

// src/components/modules/clientes/tabla-clientes-ui.tsx
import { type Customer } from '@/generated/prisma';
import { Button } from '@/components/ui/button';

interface TablaClientesUIProps {
  clientes: Customer[];
}

export function TablaClientesUI({ clientes }: TablaClientesUIProps) {
  // lógica del componente
}
```

## Checklist antes de terminar
- [ ] Nombre del archivo en kebab-case
- [ ] Nombre del componente en PascalCase
- [ ] Props tipadas con TypeScript (sin `any`)
- [ ] `'use client'` solo si es necesario
- [ ] Todos los textos en español dominicano
- [ ] Sin hard-coding de colores (usar Tailwind)
- [ ] Loading state si hace async
