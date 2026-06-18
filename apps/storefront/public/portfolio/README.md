# Portafolio — imágenes

Aquí van las fotos reales de cada trabajo del portafolio.

## Cómo añadir un trabajo nuevo (Nikita)

1. Sube las fotos a esta carpeta (`/public/portfolio/`). Recomendado:
   - Formato `.jpg` o `.webp`, lado largo ~1600 px, bien comprimidas.
   - Nombra los archivos con un patrón claro, p. ej. `wrapping-g63-1.jpg`, `wrapping-g63-2.jpg`.
2. Abre `apps/storefront/src/lib/portfolio.ts` y añade (o edita) un objeto en el array `PORTFOLIO`.
   - `thumbnail`: la foto que se ve en la rejilla (suele ser la mejor del trabajo).
   - `images`: todas las fotos del trabajo (se muestran en el carrusel del modal). Ruta desde la raíz: `/portfolio/mi-foto.jpg`.
   - `serviceType`: uno de `wrapping | car-design | chrome-delete | ahumado | rotulacion` (controla el filtro).
3. Listo. No hace falta tocar componentes.

> Las imágenes actuales son PLACEHOLDERS (copias de `/servicios/`). Reemplázalas por fotos reales.
