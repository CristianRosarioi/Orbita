# Skill: Migración de Base de Datos

## Cuándo usar
Cuando necesites modificar el schema de Prisma y aplicar esos cambios a la base de datos.

## Comandos por entorno

### Desarrollo local
```bash
# Crear y aplicar nueva migración
pnpm prisma migrate dev --name descripcion_del_cambio

# Ver estado de migraciones
pnpm prisma migrate status

# Regenerar cliente Prisma sin migrar
pnpm prisma generate
```

### Staging y Producción (solo via CI/CD)
```bash
# NUNCA ejecutar manualmente en producción
pnpm prisma migrate deploy
```

## Convenciones de nombres de migración
```
add_[tabla]                      → add_customers
add_[campo]_to_[tabla]           → add_rnc_to_customers
remove_[campo]_from_[tabla]      → remove_old_code_from_products
create_index_[tabla]_[campo]     → create_index_invoices_ncf
rename_[campo]_to_[nuevo]        → rename_codigo_to_sku_in_products
add_fiscal_mode_to_tenants       → descriptivo y claro
```

## Checklist de migración segura
- [ ] Revisar el SQL generado en `prisma/migrations/[ts]_[nombre]/migration.sql`
- [ ] La migración NO elimina datos (si hay DROP, justificarlo)
- [ ] Si hay renaming, migrar datos antes de eliminar la columna vieja
- [ ] Índices añadidos para campos nuevos de búsqueda
- [ ] Valores por defecto correctos en columnas NOT NULL
- [ ] Probada en local antes de hacer PR
- [ ] Migración aplicada a BD de staging antes de producción

## Migración con datos (ejemplo)
```sql
-- En migration.sql (editado manualmente)
ALTER TABLE tenants ADD COLUMN fiscal_mode VARCHAR(10) DEFAULT 'simple' NOT NULL;

-- Migrar tenants existentes que ya tienen RNC
UPDATE tenants SET fiscal_mode = 'fiscal' WHERE rnc IS NOT NULL AND rnc != '';
```

## NUNCA HACER
- Editar un archivo de migración ya ejecutado
- Usar `prisma db push` en staging o producción
- Hacer DROP de columnas sin verificar que no tienen datos en producción
- Migrar producción sin haber probado en staging primero
