# Migración WooCommerce → Medusa

Pipeline en cinco pasos, idempotentes, todos consumen / producen JSON
en `output/` para que se pueda inspeccionar antes de tocar producción.

## Preparación

```bash
cd scripts/migration
cp .env.example .env
# rellena WP_*, MEDUSA_*, R2_*, TARGET_SALES_CHANNEL_ID
npm install
```

`TARGET_SALES_CHANNEL_ID` se obtiene del seed del backend o del Admin UI
(Sales Channels → Tienda Online).

`WP_APPLICATION_PASSWORD` se genera en WordPress: Users → Profile →
Application Passwords (`https://<wp>/wp-admin/profile.php`).

## Orden de ejecución

```bash
# 1. Exporta productos / variaciones / clientes / categorías a output/*.json
npm run export

# 2. Sube imágenes a R2 y guarda mapping (URL Woo → URL R2)
npm run upload:media

# 3. Convierte productos a CSV importable por Medusa
npm run transform
#    → output/products-medusa.csv
#    → impórtalo desde Medusa Admin: Products → Import (.csv)

# 4. Importa clientes vía Admin API (idempotente)
npm run import:customers
#    → output/customers-import-report.json

# 5. Verifica counts y muestra una muestra de 5 productos comparando precios
npm run verify
```

## Notas

- El paso 3 genera un CSV en el formato de Medusa Admin. Para importes muy
  grandes (>10k productos) considera dividirlo en lotes de ~5k filas.
- Las contraseñas de cliente **no se migran**. Los clientes deberán hacer
  "olvidé mi contraseña" la primera vez. Esto es intencional: WordPress
  usa hashes phpass que Medusa no entiende.
- `upload-media.ts` deduplica por hash de URL. Si re-ejecutas, solo se
  suben las imágenes nuevas.
- Si un producto en Woo es `variable` con muchas combinaciones, cada fila
  del CSV representa una variante; Medusa las agrupa por `Product Handle`.

## Rollback

Todos los pasos son aditivos sobre Medusa. Para limpiar y reintentar:

```bash
# desde apps/backend/
npm run db:setup    # ojo: trunca y vuelve a sembrar
```

## Errores comunes

| Síntoma | Causa probable | Fix |
|---|---|---|
| `401` al exportar | Application Password mal copiada | Asegúrate de no añadir espacios; los espacios dentro **sí** forman parte de la password. |
| `409` al importar customer | Email duplicado en Medusa | El script lo salta y lo reporta en `customers-import-report.json`. |
| Imágenes no aparecen tras import | Olvidaste correr `upload:media` antes de `transform` | El CSV tiene URLs Woo. Re-ejecuta media → transform → re-import. |
