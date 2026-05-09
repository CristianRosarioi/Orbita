# Órbita — Sistema de Gestión Empresarial

> SaaS multi-tenant de facturación y gestión empresarial para República Dominicana  
> Desarrollado por **Órbita RD**

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![License](https://img.shields.io/badge/License-Privada-red)

---

## Descripción

**Órbita** es un sistema SaaS multi-tenant de facturación y gestión empresarial diseñado específicamente para el mercado dominicano, con cumplimiento total de los requerimientos fiscales de la DGII (NCF, e-CF, ITBIS, reportes 606/607).

Soporta **13 industrias** y cuenta con **32 módulos** incluyendo facturación, inventario, POS, nómina, CRM y reportes fiscales.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Backend | Next.js API Routes + Prisma 7 + Zod |
| Base de datos | PostgreSQL 16 |
| Autenticación | Clerk |
| Testing | Vitest + Playwright |
| Paquetes | pnpm |

---

## Requisitos previos

- **Node.js** 20+ (recomendado 24)
- **pnpm** 9+
- **Docker** y **Docker Compose** (para PostgreSQL local)
- **Git**

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone git@github.com:CristianRosarioi/Orbita.git
cd Orbita

# 2. Instalar dependencias
pnpm install

# 3. Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores (Clerk keys, etc.)

# 4. Levantar la base de datos
docker-compose up -d

# 5. Aplicar migraciones
pnpm prisma migrate dev

# 6. Generar cliente de Prisma
pnpm prisma generate
```

---

## Desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 3001)
pnpm dev

# Ver la app en: http://localhost:3001
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo en puerto 3001 |
| `pnpm build` | Build de producción |
| `pnpm start` | Servidor de producción |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm test` | Tests unitarios con Vitest (modo watch) |
| `pnpm test:run` | Tests unitarios (una sola ejecución) |
| `pnpm test:ui` | UI de Vitest en el browser |
| `pnpm test:e2e` | Tests end-to-end con Playwright |
| `pnpm prisma migrate dev` | Crear y aplicar nueva migración |
| `pnpm prisma studio` | Interfaz visual de la base de datos |

---

## Estructura del proyecto

```
Orbita/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Rutas de autenticación (Clerk)
│   │   ├── (dashboard)/      # Rutas del sistema
│   │   └── api/              # Endpoints de la API
│   ├── components/
│   │   ├── ui/               # Componentes base (shadcn/ui)
│   │   ├── shared/           # Componentes compartidos
│   │   ├── layout/           # Sidebar, header, navegación
│   │   └── modules/          # Componentes por módulo
│   ├── lib/
│   │   ├── prisma.ts         # Cliente de Prisma (singleton)
│   │   ├── utils.ts          # Utilidades generales
│   │   ├── validations/      # Schemas de Zod
│   │   └── constants.ts      # Constantes del proyecto
│   ├── hooks/                # Custom hooks de React
│   ├── types/                # Tipos TypeScript globales
│   └── i18n/                 # Configuración de next-intl
├── prisma/
│   ├── schema.prisma         # Schema de la base de datos
│   └── migrations/           # Migraciones
├── tests/
│   ├── setup.ts              # Configuración de Vitest
│   ├── unit/                 # Tests unitarios
│   ├── integration/          # Tests de integración
│   └── e2e/                  # Tests Playwright
├── .claude/
│   ├── agents/               # Agentes especializados de Claude Code
│   └── skills/               # Skills documentadas
├── docker-compose.yml        # PostgreSQL para desarrollo
├── CLAUDE.md                 # Contexto completo para Claude Code
└── README.md                 # Este archivo
```

---

## Configuración de entorno

Copia `.env.example` a `.env.local` y completa:

```env
# Base de datos
DATABASE_URL="postgresql://orbita:orbita_dev_2026@localhost:5432/orbita_dev"

# Clerk (obtener en clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

---

## Convenciones de commits

Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva funcionalidad
fix: corrección de bug
chore: mantenimiento
docs: documentación
test: tests
refactor: refactoring sin cambio de funcionalidad
```

---

## Licencia

Propietaria — Órbita RD © 2026. Todos los derechos reservados.
