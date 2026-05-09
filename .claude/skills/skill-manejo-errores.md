# Skill: Manejo de Errores

## Cuándo usar
En todo endpoint de API, Server Component y Client Component de Órbita. El manejo de errores es obligatorio — nunca dejar un `catch` vacío ni exponer errores técnicos al usuario.

---

## Estructura estándar de respuesta de error en API Routes

```typescript
// Formato estándar de toda respuesta de error en Órbita
{
  success: false,
  error: {
    code: string,      // Código interno (VALIDATION_ERROR, NOT_FOUND, etc.)
    message: string,   // Mensaje amigable en español dominicano para el usuario
    details?: unknown  // Solo en desarrollo — nunca en producción
  }
}
```

### Helper de respuestas — crear en src/lib/api-response.ts
```typescript
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '../generated/prisma/client';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function err(code: string, message: string, status = 400, details?: unknown) {
  const body: Record<string, unknown> = { success: false, error: { code, message } };
  // Solo incluir detalles en desarrollo — nunca exponer stack traces en producción
  if (process.env.NODE_ENV === 'development' && details) {
    body.error = { ...(body.error as object), details };
  }
  return NextResponse.json(body, { status });
}
```

---

## Códigos de error estándar del sistema

| Código | HTTP | Cuándo usar |
|---|---|---|
| `UNAUTHORIZED` | 401 | No hay sesión activa |
| `FORBIDDEN` | 403 | Sesión válida pero sin permiso |
| `NOT_FOUND` | 404 | Recurso no existe o pertenece a otro tenant |
| `VALIDATION_ERROR` | 422 | Zod falló la validación |
| `CONFLICT` | 409 | Duplicado o dependencias activas |
| `INTERNAL_ERROR` | 500 | Error no esperado (bug) |
| `TENANT_MISMATCH` | 403 | Intento de acceso a datos de otro tenant |
| `NCF_SEQUENCE_EXHAUSTED` | 422 | Se acabaron los NCF de esa serie |
| `FISCAL_PERIOD_CLOSED` | 422 | El período fiscal ya está cerrado |
| `INVALID_STATE` | 422 | El documento está en un estado que no permite la operación |

---

## Patrón de try/catch en endpoints

```typescript
// src/app/api/clientes/[id]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { Prisma } from '@/generated/prisma/client';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { orgId } = await auth();
    if (!orgId) return err('UNAUTHORIZED', 'Tu sesión expiró. Por favor inicia sesión de nuevo.', 401);

    const cliente = await prisma.customer.findFirst({
      where: { id: params.id, tenantId: orgId, deletedAt: null },
    });

    if (!cliente) {
      return err('NOT_FOUND', 'Este cliente no existe o fue eliminado.', 404);
    }

    return ok(cliente);
  } catch (error) {
    return handleUnexpectedError(error, 'obtener cliente');
  }
}
```

---

## Función handleUnexpectedError — centralizar errores no esperados

```typescript
// src/lib/api-response.ts (agregar a las funciones existentes)
import { logger } from '@/lib/logger';

export function handleUnexpectedError(error: unknown, contexto: string) {
  // Clasificar el error antes de loggear
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Error no esperado — loggear con contexto pero SIN datos del request
  logger.error('Error inesperado', {
    contexto,
    // ✅ Loggear: tipo de error, código, timestamp, tenantId (si disponible)
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    message: error instanceof Error ? error.message : 'Error desconocido',
    // ❌ NUNCA loggear: RNC, cédulas, tokens, passwords, datos de tarjetas
  });

  return err(
    'INTERNAL_ERROR',
    'Ocurrió un problema inesperado. Por favor inténtalo de nuevo o contacta soporte.',
    500,
  );
}
```

---

## Cómo loggear errores sin exponer datos sensibles

### Configurar logger en src/lib/logger.ts
```typescript
// Logger estructurado — usar en lugar de console.log
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...sanitize(meta) }));
    }
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...sanitize(meta) }));
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', message, timestamp: new Date().toISOString(), ...sanitize(meta) }));
  },
};

// Elimina campos sensibles antes de loggear
function sanitize(meta?: Record<string, unknown>): Record<string, unknown> {
  if (!meta) return {};
  const CAMPOS_SENSIBLES = ['password', 'token', 'rnc', 'cedula', 'cardNumber', 'cvv', 'secret', 'key'];
  return Object.fromEntries(
    Object.entries(meta).filter(([key]) => !CAMPOS_SENSIBLES.some((s) => key.toLowerCase().includes(s))),
  );
}
```

### Qué SÍ loggear vs qué NUNCA loggear

```typescript
// ✅ SÍ loggear — información de diagnóstico sin datos del usuario
logger.error('Error al asignar NCF', {
  tenantId: orgId,          // ✅ ID de organización (no dato personal)
  tipoNcf: 'B01',           // ✅ Tipo de operación
  errorCode: 'P2002',       // ✅ Código técnico del error
  contexto: 'asignar-ncf',  // ✅ Qué se estaba haciendo
});

// ❌ NUNCA loggear — datos sensibles
logger.error('Error al facturar', {
  rnc: cliente.rnc,              // ❌ RNC del cliente
  cedula: usuario.cedula,        // ❌ Cédula
  token: req.headers.auth,       // ❌ Token de autenticación
  password: body.password,       // ❌ Contraseña
  cardNumber: body.cardNumber,   // ❌ Número de tarjeta
  email: cliente.email,          // ❌ Email (dato personal)
  nombre: cliente.nombre,        // ❌ Nombre completo
});
```

---

## Diferencia: errores esperados vs no esperados

### Errores esperados — flujo normal del negocio
Son situaciones anticipadas. Se manejan con `if` y retornan respuestas claras:
```typescript
// El cliente no tiene RNC pero quiere factura B01
if (tipoNcf === 'B01' && !cliente.rnc) {
  return err('VALIDATION_ERROR', 'Para emitir comprobante fiscal (B01), el cliente debe tener RNC registrado.', 422);
}

// El NCF ya fue usado
if (ncfRecord.estado === 'USADO') {
  return err('CONFLICT', 'Este comprobante ya fue emitido.', 409);
}
```

### Errores no esperados — bugs o condiciones imprevistas
Son situaciones que no deberían ocurrir. Se capturan con `try/catch`, se loggean y se devuelve un mensaje genérico:
```typescript
try {
  // ... operación normal
} catch (error) {
  // Este catch solo debería ejecutarse si hay un bug real
  return handleUnexpectedError(error, 'crear-factura');
}
```

---

## Manejo de errores de validación de Zod

```typescript
import { z } from 'zod';

const body = await req.json().catch(() => null);
if (!body) {
  return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);
}

const parsed = CreateFacturaSchema.safeParse(body);
if (!parsed.success) {
  // Tomar el primer error de Zod y formatearlo para el usuario
  const primerError = parsed.error.issues[0];
  const campo = primerError.path.join('.');

  // Traducir errores técnicos de Zod a español amigable
  const mensajeAmigable = traducirErrorZod(primerError);

  return err('VALIDATION_ERROR', mensajeAmigable, 422);
}

// Función auxiliar para mensajes en español
function traducirErrorZod(issue: z.ZodIssue): string {
  switch (issue.code) {
    case 'too_small':
      return `El campo "${issue.path.join('.')}" es requerido y no puede estar vacío.`;
    case 'too_big':
      return `El campo "${issue.path.join('.')}" excede el límite permitido.`;
    case 'invalid_type':
      return `El campo "${issue.path.join('.')}" tiene un formato incorrecto.`;
    case 'invalid_string':
      if (issue.validation === 'email') return 'El correo electrónico ingresado no es válido.';
      return `El campo "${issue.path.join('.')}" no tiene el formato esperado.`;
    default:
      return issue.message; // Usar el mensaje del schema si ya está en español
  }
}
```

---

## Manejo de errores de Prisma

```typescript
import { Prisma } from '@/generated/prisma/client';

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError) {
  switch (error.code) {
    case 'P2002':
      // Violación de unique constraint
      const campo = (error.meta?.target as string[])?.join(', ') ?? 'campo';
      return err('CONFLICT', `Ya existe un registro con ese ${campo}. Por favor verifica los datos.`, 409);

    case 'P2025':
      // Record not found (usado en update/delete cuando el registro no existe)
      return err('NOT_FOUND', 'El registro que intentas modificar no existe o fue eliminado.', 404);

    case 'P2003':
      // Violación de foreign key
      return err('CONFLICT', 'No se puede completar la operación porque tiene datos relacionados.', 409);

    case 'P2034':
      // Transaction conflict (write conflict)
      return err('CONFLICT', 'Hubo un conflicto al procesar la solicitud. Por favor inténtalo de nuevo.', 409);

    case 'P1001':
      // Can't reach database
      logger.error('Base de datos no disponible', { errorCode: error.code });
      return err('INTERNAL_ERROR', 'El servicio no está disponible en este momento. Por favor inténtalo en unos minutos.', 503);

    default:
      logger.error('Error de Prisma no manejado', { errorCode: error.code, errorMeta: error.meta });
      return err('INTERNAL_ERROR', 'Ocurrió un error al procesar tu solicitud. Por favor inténtalo de nuevo.', 500);
  }
}
```

---

## Manejo de errores en el frontend (Client Components)

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function FormularioCliente() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: CreateClienteInput) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        // Mostrar el mensaje del servidor al usuario (ya viene en español)
        toast.error(result.error.message);
        return;
      }

      toast.success('Cliente creado correctamente.');
      // ... lógica de éxito

    } catch (error) {
      // Error de red u otro error inesperado en el cliente
      // NUNCA mostrar error.message al usuario (puede tener info técnica)
      toast.error('No pudimos conectar con el servidor. Por favor verifica tu conexión e inténtalo de nuevo.');

      // Loggear para depuración (en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.error('[FormularioCliente] Error de red:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ...
}
```

---

## Errores que NUNCA deben mostrarse al usuario

Estos errores deben reemplazarse por un mensaje genérico:

| Error técnico | Mensaje genérico al usuario |
|---|---|
| Stack trace de Node.js | "Ocurrió un problema inesperado. Por favor inténtalo de nuevo." |
| Mensaje de Prisma crudo | "Error al guardar los datos. Por favor inténtalo de nuevo." |
| Error de conexión a BD | "El servicio no está disponible. Inténtalo en unos minutos." |
| JWT expired / invalid | "Tu sesión expiró. Por favor inicia sesión de nuevo." |
| CORS error | "No pudimos conectar con el servidor. Verifica tu conexión." |
| Timeout de red | "La solicitud tardó demasiado. Por favor inténtalo de nuevo." |
| Detalles de validación interna | Mensaje específico del campo en español (no el error técnico de Zod) |

---

## Integración futura con Sentry (preparada pero no activa)

La integración con Sentry se activará en la Fase 3. El código debe estar preparado desde ahora:

```typescript
// src/lib/monitoring.ts — crear vacío ahora, completar en Fase 3
export function captureException(error: unknown, context?: Record<string, unknown>) {
  // TODO Fase 3: Sentry.captureException(error, { extra: sanitize(context) });
  // Por ahora, solo loggear localmente
  logger.error('Exception capturada', {
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    ...context,
  });
}

// Usar en lugar de logger.error para errores críticos
// que eventualmente irán a Sentry
captureException(error, { contexto: 'asignar-ncf', tenantId: orgId });
```

**Regla al integrar Sentry:** Los datos enviados a Sentry deben pasar por `sanitize()` — nunca enviar RNC, cédulas, tokens ni datos de tarjetas al servicio de monitoreo externo.

---

## Checklist de manejo de errores

- [ ] Todo endpoint tiene `try/catch` que llama a `handleUnexpectedError`
- [ ] Mensajes de error al usuario en español dominicano y amigables
- [ ] Códigos de error usando los estándar del sistema (tabla arriba)
- [ ] Errores de Zod traducidos con `traducirErrorZod`
- [ ] Errores de Prisma manejados con `handlePrismaError`
- [ ] Nada sensible en los logs (RNC, cédulas, tokens, passwords, tarjetas)
- [ ] Stack traces NUNCA expuestos al cliente en producción
- [ ] `captureException` usado para errores críticos (preparado para Sentry)
- [ ] Client Components muestran mensaje genérico para errores de red
- [ ] `finally` para resetear estados de loading siempre
