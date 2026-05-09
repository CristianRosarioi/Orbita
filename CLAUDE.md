# CLAUDE.md — Órbita RD

> Guía de contexto para Claude Code. Léela completa antes de tocar cualquier archivo.

---

## Descripción del Proyecto

**Órbita** es un sistema SaaS multi-tenant de facturación y gestión empresarial desarrollado por **Órbita RD** para el mercado de República Dominicana, preparado para expandirse a Latinoamérica.

- **Idioma de interfaz**: español dominicano en toda la UI
- **Modelo de negocio**: suscripción mensual por empresa (tenant), con planes por módulos activos
- **Cumplimiento fiscal**: DGII (Dirección General de Impuestos Internos) — NCF, e-CF, ITBIS 18%
- **Repo**: `git@github.com:CristianRosarioi/Orbita.git` / branch `main`

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Lucide React |
| Internacionalización | next-intl |
| Backend | Next.js API Routes + Prisma 7 ORM + Zod |
| Base de datos | PostgreSQL 16 (Docker local, AWS RDS en producción) |
| Autenticación | Clerk (se instala en Fase 1) |
| Testing | Vitest + Playwright + Testing Library |
| Monitoreo | Sentry + PostHog (se configuran en Fase 3) |
| Gestor de paquetes | pnpm (NUNCA npm ni yarn) |
| CI/CD | GitHub Actions |
| Hosting | AWS (App Runner + RDS + S3 + Lambda) |
| PDFs | Puppeteer en AWS Lambda |

---

## Reglas Absolutas (las 16 — nunca romper)

1. **pnpm siempre** — nunca usar npm ni yarn
2. **TypeScript estricto** — `strict: true`, cero `any` sin justificación
3. **Zod para toda validación** — nunca confiar en datos sin parsear
4. **Soft delete obligatorio** — nunca `DELETE` en la base de datos; siempre `deletedAt`
5. **Multi-tenancy en todo** — toda query debe filtrar por `tenantId`
6. **NCF/e-CF inmutable** — un comprobante emitido NUNCA se modifica, solo se anula con nota de crédito
7. **Conventional Commits** — `feat:`, `fix:`, `chore:`, etc.
8. **Español dominicano en UI** — todos los textos visibles al usuario en español dominicano
9. **API response estándar** — siempre usar el formato `{ success, data, error, meta }` definido abajo
10. **Sin `console.log` en producción** — usar logger estructurado
11. **Transacciones para operaciones críticas** — facturación, pagos, inventario
12. **Permisos por rol** — verificar autorización en cada endpoint
13. **Nunca exponer IDs internos** — usar UUIDs o slugs en URLs públicas
14. **Tests para lógica fiscal** — NCF, ITBIS, e-CF siempre con cobertura de tests
15. **Migraciones forward-only** — nunca editar una migración ya ejecutada
16. **Documentar decisiones no obvias** — comentar el POR QUÉ, no el QUÉ

---

## Convenciones de Nombres

```
Archivos:          kebab-case          → factura-controller.ts
Componentes:       PascalCase          → FacturaDetalle.tsx
Hooks:             camelCase con use   → useFactura.ts
Funciones:         camelCase           → calcularITBIS()
Constantes:        SCREAMING_SNAKE     → ITBIS_RATE
Tipos/Interfaces:  PascalCase + sufijo → FacturaDTO, CreateFacturaInput
Tablas BD:         snake_case plural   → facturas, clientes
Campos BD:         snake_case          → created_at, tenant_id
Variables env:     SCREAMING_SNAKE     → DATABASE_URL
Ramas git:         kebab-case          → feat/modulo-facturacion
```

---

## Estructura de Respuesta API Estándar

```typescript
// Éxito con datos
{ success: true, data: T, meta?: { total, page, limit } }

// Error
{ success: false, error: { code: string, message: string, details?: any } }

// Lista paginada
{ success: true, data: T[], meta: { total: number, page: number, limit: number, totalPages: number } }
```

Códigos de error:
- `VALIDATION_ERROR` — Zod falló
- `NOT_FOUND` — recurso no encontrado
- `UNAUTHORIZED` — sin autenticación
- `FORBIDDEN` — sin permisos para esta operación
- `TENANT_MISMATCH` — acceso a datos de otro tenant
- `NCF_SEQUENCE_EXHAUSTED` — se acabaron los NCF de esa serie
- `FISCAL_LOCK` — período fiscal cerrado

---

## Idioma — Español Dominicano

- "tú" no "usted" en mensajes al usuario
- "factura" no "invoice", "cliente" no "customer" en UI
- Números: `1.234,56` (punto para miles, coma para decimales) — EXCEPCIÓN: en código siempre punto decimal
- Fechas: `DD/MM/YYYY`
- Moneda por defecto: DOP (pesos dominicanos)
- Horario: UTC-4 (República Dominicana no cambia hora)

---

## Las 13 Industrias Soportadas

1. Retail / Comercio al detalle
2. Restaurantes y Food Service
3. Servicios Profesionales (abogados, consultores, contadores)
4. Salud (clínicas, farmacias, laboratorios)
5. Construcción y Contratistas
6. Educación (colegios, academias, tutorías)
7. Belleza y Estética (salones, spas)
8. Automotriz (talleres, repuestos, ventas)
9. Hotelería y Turismo
10. Tecnología y Servicios IT
11. Transporte y Logística
12. Manufactura y Producción
13. Importadores y Distribuidores

---

## Los 32 Módulos del Sistema

### Núcleo (obligatorios en todos los planes)
1. `auth` — Autenticación y gestión de usuarios
2. `tenants` — Gestión de empresas (multi-tenant)
3. `billing` — Suscripción y pagos del SaaS
4. `settings` — Configuración del sistema

### Fiscal (críticos para cumplimiento DGII)
5. `ncf` — Comprobantes Fiscales (NCF clásicos)
6. `ecf` — e-CF (comprobantes electrónicos)
7. `dgii-reports` — Reportes 606, 607, IT-1, IR-17

### Operaciones Principales
8. `customers` — Gestión de clientes
9. `suppliers` — Gestión de suplidores
10. `invoicing` — Facturación y notas de crédito
11. `purchases` — Compras y gastos
12. `products` — Catálogo de productos y servicios
13. `inventory` — Control de inventario
14. `pos` — Punto de venta (POS)
15. `quotes` — Cotizaciones y presupuestos
16. `orders` — Órdenes de trabajo / pedidos

### Finanzas
17. `accounting` — Contabilidad básica (cuentas T)
18. `cash-flow` — Flujo de caja y tesorería
19. `expenses` — Gestión de gastos operativos
20. `payroll` — Nómina y recursos humanos

### Relaciones
21. `crm` — Gestión de relaciones con clientes
22. `contracts` — Contratos y acuerdos
23. `projects` — Gestión de proyectos

### Reportes y Analytics
24. `reports` — Reportes operativos
25. `analytics` — Dashboard analytics y KPIs
26. `forecasting` — Proyecciones y predicciones

### Canales
27. `ecommerce` — Tienda en línea básica
28. `catalog` — Catálogo digital compartible
29. `appointments` — Sistema de citas/turnos

### Operaciones Especiales
30. `assets` — Gestión de activos fijos
31. `multi-location` — Múltiples sucursales
32. `integrations` — Integraciones con terceros (WhatsApp, email, etc.)

---

## Modelo Fiscal — Modo Simple vs Modo Fiscal

### Modo Simple (para negocios informales o en transición)
- Factura sin NCF (solo para registro interno)
- Sin reportes DGII
- Sin cálculo de ITBIS separado
- Perfecto para inicio de operaciones

### Modo Fiscal (cumplimiento DGII completo)
- NCF obligatorio en toda transacción
- e-CF con firma digital y envío a DGII
- ITBIS 18% calculado y reportado
- Reportes 606, 607, IT-1
- Secuencias de NCF por tipo (B01, B02, B14, B15, B16, B17)
- Período fiscal mensual con cierre
- Retenciones (ISRN, ISR)

El modo se activa por tenant en `settings.fiscal.mode: 'simple' | 'fiscal'`

---

## Estado Actual del Desarrollo

### Fase 0 — Setup Inicial ✅ COMPLETADA
- Estructura del proyecto
- Stack tecnológico configurado
- Agentes y skills documentados
- Docker para desarrollo
- Git hooks y conventional commits

### Fase 1 — Autenticación y Base (SIGUIENTE)
- Clerk integration
- Schema de base de datos (tenants, users, roles)
- Layout del dashboard
- Onboarding flow

### Fases 2–11 (planificadas)
Ver sección "Plan de Fases" más abajo.

---

## Los 8 Agentes Disponibles

| Agente | Archivo | Responsabilidad |
|---|---|---|
| Frontend | `.claude/agents/frontend-agent.md` | UI, componentes, adaptación por industria |
| Backend | `.claude/agents/backend-agent.md` | API Routes, lógica de negocio |
| Database | `.claude/agents/database-agent.md` | Prisma, schema, migraciones |
| Fiscal | `.claude/agents/fiscal-agent.md` | NCF, e-CF, DGII, ITBIS |
| Security | `.claude/agents/security-agent.md` | Auth, multitenancy, dependencias |
| PDF | `.claude/agents/pdf-agent.md` | Puppeteer, Lambda, impresión |
| Testing | `.claude/agents/testing-agent.md` | Vitest, Playwright, tests fiscales |
| DevOps | `.claude/agents/devops-agent.md` | AWS, CI/CD, deployment |

---

## Las 12 Skills Documentadas

| Skill | Archivo |
|---|---|
| Crear endpoint API | `.claude/skills/skill-crear-endpoint.md` |
| Crear componente UI | `.claude/skills/skill-crear-componente.md` |
| Crear modelo BD | `.claude/skills/skill-crear-modelo-bd.md` |
| Generar PDF | `.claude/skills/skill-generar-pdf.md` |
| Migración de BD | `.claude/skills/skill-migracion-bd.md` |
| Gestión de NCF | `.claude/skills/skill-ncf.md` |
| Multitenancy | `.claude/skills/skill-multitenancy.md` |
| Transacciones | `.claude/skills/skill-transacciones.md` |
| Validación Zod | `.claude/skills/skill-validacion-zod.md` |
| Soft Delete | `.claude/skills/skill-soft-delete.md` |
| Flujo de Aprobaciones | `.claude/skills/skill-aprobaciones.md` |
| Manejo de Errores | `.claude/skills/skill-manejo-errores.md` |

---

## Plan de Fases

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Setup inicial + estructura + agentes | ✅ Completada |
| 1 | Auth (Clerk) + schema base + dashboard layout | 🔜 Siguiente |
| 2 | Módulo de clientes + productos + facturación básica | ⏳ Planificada |
| 3 | NCF + modo fiscal + reportes DGII 606/607 | ⏳ Planificada |
| 4 | e-CF (comprobantes electrónicos) + firma digital | ⏳ Planificada |
| 5 | Inventario + POS + punto de venta | ⏳ Planificada |
| 6 | Compras + suplidores + gastos | ⏳ Planificada |
| 7 | Nómina + RRHH + TSS | ⏳ Planificada |
| 8 | CRM + contratos + proyectos | ⏳ Planificada |
| 9 | Analytics + reportes avanzados + BI | ⏳ Planificada |
| 10 | e-Commerce + catálogo + integraciones | ⏳ Planificada |
| 11 | Multi-sucursal + franquicias + escalado | ⏳ Planificada |
