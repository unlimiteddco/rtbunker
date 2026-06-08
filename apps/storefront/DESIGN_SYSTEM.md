# RT Bunker · Design System

Sistema de diseño del storefront. Está alineado con el handoff bundle del
cliente (`RT Bunker Design System-handoff.zip`). Esta documentación es la
referencia para añadir componentes nuevos sin romper la consistencia.

---

## Principios

1. **60% off-white · 30% black · 10% yellow.** El amarillo es un sello,
   nunca un fondo de cuerpo de texto largo.
2. **Esquinas redondeadas siempre.** Square corners están fuera de marca.
3. **Mecánico, no bouncy.** Hover lift de 2px, easing `cubic-bezier(0.16, 1, 0.3, 1)`,
   220 ms. Press → pierde el lift (más táctil).
4. **Un sistema de iconos a la vez.** Lucide en stand-in hasta que el
   cliente entregue los SVG originales.
5. **Una sola emoji sancionada: 📦** (en el banner newsletter).

---

## Tokens

Source of truth: [`src/app/globals.css`](src/app/globals.css).

### Colores

| Token CSS              | Hex      | Uso                                       |
| ---------------------- | -------- | ----------------------------------------- |
| `--rt-yellow`          | `#FFBA01`| CTA primarios, marquee, stamps, focus ring|
| `--rt-yellow-deep`     | `#E5A300`| Hover del primary                         |
| `--rt-yellow-soft`     | `#FFE08A`| Highlights tintados                       |
| `--rt-black`           | `#0F0F0F`| Surface oscura, hero, footer, texto       |
| `--rt-black-2`         | `#1A1A1A`| Surface elevada sobre black               |
| `--rt-black-3`         | `#262626`| Cards sobre dark                          |
| `--rt-white`           | `#FCFCFC`| Page background, cards                    |
| `--rt-white-2`         | `#F4F4F2`| Page tint, secciones suaves               |
| `--rt-white-3`         | `#ECECEA`| Hairlines, ghost button bg                |
| `--rt-ink-500`         | `#6B6B6B`| Texto secundario                          |
| `--rt-ink-300`         | `#B3B3B3`| Placeholders, copy sobre dark             |
| `--rt-ink-100`         | `#E3E3E1`| Borders en light                          |
| `--rt-danger`          | `#C8321F`| Errores, precios rebajados                |
| `--rt-success`         | `#1B7A3E`| Estados ok                                |

Usos preferentes en Tailwind:

```tsx
<div className="bg-rt-black text-rt-white" />
<a className="text-rt-yellow hover:text-rt-yellow-deep" />
<span className="text-rt-ink-500" />
```

Las variables shadcn (`--background`, `--foreground`, `--primary`…) se
derivan automáticamente de los tokens RT y siguen funcionando: `bg-primary`
sigue siendo amarillo, `text-foreground` sigue siendo carbón, etc.

### Tipografía

| Rol         | Familia        | Uso                                                            |
| ----------- | -------------- | -------------------------------------------------------------- |
| Display     | **Anton**      | Hero, marquee numbers, sticker artwork                         |
| Heading     | **Montserrat** | h1–h4, product titles, eyebrows, botones uppercase             |
| Body / UI   | **Inter**      | Párrafos, meta, prices, form fields                            |

Las 3 se cargan con `next/font/google` en `[locale]/layout.tsx` y se
exponen como `--font-anton`, `--font-montserrat`, `--font-inter`. En CSS
las usas vía `font-[family-name:var(--font-display)]` etc.

Clases utilitarias listas:

| Clase         | Equivalente                                          |
| ------------- | ---------------------------------------------------- |
| `.rt-display` | Anton, clamp(56px,8vw,112px), uppercase              |
| `.rt-h1`      | Montserrat 800, clamp(36px,5vw,64px)                 |
| `.rt-h2`      | Montserrat 800, 44px                                 |
| `.rt-h3`      | Montserrat 700, 32px                                 |
| `.rt-h4`      | Montserrat 700, 24px                                 |
| `.rt-eyebrow` | Montserrat 700, 13px, tracking 0.18em, uppercase     |
| `.rt-meta`    | Inter 500, 13px, ink-500                             |
| `.rt-price`   | Montserrat 700, 16px                                 |
| `.text-eyebrow`     | Versión muted_foreground                       |
| `.text-uppercase-tight` | Inline uppercase tracking 0.08em (botones) |

### Radii

`xs:4 · sm:8 · md:14 (default) · lg:20 · xl:28 · 2xl:36 · 3xl:48 · pill:999`

- Chips, tags, inputs → `rounded-sm` (8 px)
- Botones, cards, badges → `rounded-md` (14 px)
- Hero blocks, product tiles, secciones → `rounded-lg` o `rounded-[20px]`
- "Add to cart" mini, pills, locale chip → `rounded-full`

### Sombras

`xs / sm / md / lg / xl` (escala light) + `shadow-yellow` (sólo para CTA
amarillo sobre fondo oscuro). Acceso vía Tailwind: `shadow-sm`,
`shadow-md`, `shadow-[var(--shadow-yellow)]`.

### Motion

- Duración base: 220 ms.
- Easing: `var(--ease-out-rt)` = `cubic-bezier(0.16, 1, 0.3, 1)`.
- Marquee: 24 s lineal, sin pausa en hover.
- Press → translateY(0), sin shadow.

### Layout

- Container: 1280 px (`--rt-container`).
- Gutter: `clamp(16px, 4vw, 48px)` (`--rt-gutter`).
- Helper: `.container-page`.

---

## Componentes

### Button (`components/ui/button.tsx`)

```tsx
<Button>Shop stickers</Button>                       // primary, default
<Button variant="dark" size="lg">Saber más</Button>  // CTA secundario light
<Button variant="ghost">Atrás</Button>               // outline carbón
<Button variant="ghostInv">Crear pegatinas</Button>  // outline blanco (en hero dark)
<Button variant="subtle">Actualizar</Button>         // baja jerarquía
<Button variant="link">Editar</Button>               // texto inline
<Button size="pill">Añadir</Button>                  // micro CTA redondo
```

Reglas:

- Siempre UPPERCASE, tracking 0.08em.
- Hover lift -2px (excepto link). Active → translateY(0).
- Focus ring amarillo 3px.

### PromoMarquee (`components/layout/promo-marquee.tsx`)

Banda amarilla scrollable encima del nav con `10% OFF · Código: RTBUNKER ★`.
Loop continuo 24 s. Si necesitas variantes seasonal, parametrizar `text` y
`color` en futuro.

### Header (`components/layout/header.tsx`)

- Surface `bg-rt-black`.
- Logo lockup: cuadrado amarillo + wordmark Anton 20px.
- Nav uppercase Montserrat 700, tracking 0.18em, color `--rt-white/90`.
- Hover de nav → texto amarillo.

### Footer + Newsletter (`components/layout/footer.tsx` + `newsletter.tsx`)

- Newsletter en banda amarilla DECLARANDO el descuento (📦 sancionada).
- Footer dark con headings amarillos, links blancos. Bottom-bar con
  legales + Instagram.

### Hero / CategoryGrid / WhyUs (`components/home/`)

Las tres bloques principales de la home. CategoryGrid alterna tone
yellow/dark cada 3 tiles. WhyUs usa cards `bg-rt-white-2` con badges
**cuadrados** amarillos (regla del system: NO badges circulares).

### ProductCard (`components/product/product-card.tsx`)

- Aspect 4/5, radius 20.
- Hover → translateY(-1), shadow-md, imagen scale 1.04.
- CTA "Seleccionar opciones" oculto que sube al hover (desktop).
- Badge "Oferta" pill amarilla esquina sup. izquierda.
- Precio formato `min € — max €` cuando hay rango entre variantes.

---

## Cómo añadir un color

1. Edita `globals.css`:

   ```css
   :root {
     --rt-coral: #ff6b6b;
   }

   @theme inline {
     --color-rt-coral: var(--rt-coral);
   }
   ```

2. (Opcional) Si es semántico, añade su mapeo HSL para shadcn:

   ```css
   :root {
     --warning: 5 100% 70%;
   }
   ```

3. Ya puedes usarlo: `bg-rt-coral`, `text-rt-coral`.

---

## Cómo añadir un componente nuevo

1. Crea el archivo en la carpeta apropiada:
   - `components/ui/*` → primitivo shadcn (no UI específica de negocio).
   - `components/commerce/*` → primitivo de ecommerce reutilizable (cards,
     price tags, empty states).
   - `components/home/*` → bloque de la home.
   - `components/product/*`, `components/cart/*`, `components/checkout/*`,
     `components/account/*` → flujos específicos.
   - `components/layout/*` → header, footer, navegación, promo bar.

2. Usa los tokens semánticos (`bg-background`, `text-foreground`,
   `border-border`) cuando sea posible, y los tokens RT directos (`bg-rt-yellow`,
   `text-rt-black`) cuando el branding lo exija.

3. Tipografía: si el componente usa Montserrat/Anton, declara
   `font-[family-name:var(--font-heading)]` o `font-[family-name:var(--font-display)]`
   en la clase para que se aplique sin tocar globals.

4. Sigue las reglas de motion (220 ms, `var(--ease-out-rt)`).

5. Documenta con un comment-block JSDoc al inicio del componente
   explicando: qué es, sus reglas visuales, y dónde se usa.

---

## Pendientes (deuda técnica del system)

- [ ] Conseguir los SVG originales de iconos de Unlimitedd (hoy Lucide).
- [ ] Conseguir las fuentes brand reales (.woff2) si las hay. Actualmente
      Anton + Montserrat + Inter desde Google Fonts.
- [ ] Conseguir las fotografías de producto en alta resolución → cuando
      llegue, sustituir el placeholder del Hero.
- [ ] Conseguir el logo SVG original (los PNG están en assets/).
