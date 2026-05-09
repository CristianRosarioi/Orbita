# Skill: Validación con Zod

## Cuándo usar
En TODOS los endpoints que reciben datos del cliente. Nunca procesar datos sin validar.

## Ubicación de schemas
```
src/lib/validations/
├── clientes.ts        → CreateClienteSchema, UpdateClienteSchema
├── facturas.ts        → CreateFacturaSchema
├── productos.ts       → CreateProductoSchema
└── ...
```

## Patrones comunes para República Dominicana

```typescript
import { z } from 'zod';

// RNC dominicano (9 dígitos)
const RNCSchema = z.string()
  .length(9, 'El RNC debe tener exactamente 9 dígitos')
  .regex(/^\d{9}$/, 'El RNC solo debe contener números');

// Cédula dominicana (11 dígitos)
const CedulaSchema = z.string()
  .regex(/^\d{3}-?\d{7}-?\d$/, 'Formato de cédula inválido');

// Teléfono dominicano
const TelefonoSchema = z.string()
  .regex(/^(\+1)?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, 'Teléfono inválido');

// Monto monetario (siempre positivo, máximo 2 decimales)
const MontoSchema = z.number()
  .positive('El monto debe ser mayor a 0')
  .multipleOf(0.01, 'Máximo 2 decimales');

// Schema de creación de cliente
export const CreateClienteSchema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto').max(200),
  tipo: z.enum(['PERSONA_FISICA', 'EMPRESA']),
  rnc: RNCSchema.optional(),
  cedula: CedulaSchema.optional(),
  email: z.string().email('Email inválido').optional(),
  telefono: TelefonoSchema.optional(),
  direccion: z.string().max(500).optional(),
}).refine(
  (data) => data.tipo !== 'EMPRESA' || data.rnc,
  { message: 'Las empresas requieren RNC', path: ['rnc'] }
);
```

## Uso en endpoints
```typescript
const body = await req.json().catch(() => null);
if (!body) return err('INVALID_BODY', 'Body inválido o malformado', 400);

const parsed = CreateClienteSchema.safeParse(body);
if (!parsed.success) {
  const firstError = parsed.error.issues[0];
  return err('VALIDATION_ERROR', firstError.message, 422);
}

// parsed.data está tipado y limpio
const cliente = await prisma.customer.create({ data: { ...parsed.data, tenantId: orgId } });
```

## Uso con react-hook-form en frontend
```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type z } from 'zod';
import { CreateClienteSchema } from '@/lib/validations/clientes';

type CreateClienteInput = z.infer<typeof CreateClienteSchema>;

const form = useForm<CreateClienteInput>({
  resolver: zodResolver(CreateClienteSchema),
  defaultValues: { tipo: 'PERSONA_FISICA' },
});
```

## Checklist
- [ ] Schema definido en `src/lib/validations/`
- [ ] Usar `safeParse` (no `parse`) en endpoints para manejo de errores graceful
- [ ] Mensajes de error en español dominicano
- [ ] Tipos inferidos con `z.infer<typeof Schema>`
- [ ] Validaciones de negocio con `.refine()` o `.superRefine()`
