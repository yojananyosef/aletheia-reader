# Proposal: app-favicon — Favicon propio de Aletheia (reemplazar default de Next.js)

## Why

`app/favicon.ico` es byte-idéntico al default de `create-next-app` (verificado por md5 contra commit inicial), mientras que los iconos PWA (`public/icon-192.png`, `icon-512.png`) ya tienen diseño propio (libro abierto, paleta pergamino/bronce). La pestaña del navegador muestra el logo de Next/Vercel, rompiendo identidad de marca recién corregida a Aletheia.

## What (MVP)

- Crear `app/icon.svg` (libro abierto vectorial, paleta muestreada de los PNG: páginas `#FDFBF6`, tapas `#8B7355`, lomo `#6B5B3D`, filete `#C4A77D`). Next lo sirve como favicon (los navegadores prefieren SVG).
- Regenerar `app/favicon.ico` multi-tamaño (16/32/48) renderizado desde el mismo SVG como fallback (Safari antiguo, lectores RSS).
- Sin cambios de código ni layout (Next autodetecta `app/icon.svg` + `app/favicon.ico`).

## Non-Goals

- No tocar `public/icon-192/512.png` (ya son propios) ni `app/manifest.ts`.
- No declarar `metadata.icons` manual (autodetección de Next basta).

## Impact

- Afecta: `app/icon.svg` (nuevo), `app/favicon.ico` (reemplazo binario).
- Verificación: `file`/`magick identify` del ICO, `bun run build`, comprobar `<link rel="icon">` en HTML servido.
