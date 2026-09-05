# Proposal: tooltip-theme — Tooltips con colores del tema activo (fix regresión perf-pagination)

## Why

Al mover el portal de tooltips a `body` (fix del recorte), quedaron fuera del contenedor con clase `.theme-*` y las vars `--reader-*` no resuelven: el tooltip se ve con colores por defecto en vez del tema activo (reporte visual: fondo oscuro con tema claro).

## What (MVP)

- `ComfortBibleReader`: effect que sincroniza la clase de tema activa (`theme-pergamino|noche|sepia`) en `document.body` (limpia las otras dos). Los portales a body heredan las vars; de paso el overscroll usa el fondo del tema.
- Delta MODIFIED en spec `pagination-sync`: el tooltip respeta el tema activo.

## Non-Goals

- No volver el portal al contenedor (reintroduciría el recorte).
- No cambiar paleta ni estilos del tooltip.

## Impact

- Afecta: `ComfortBibleReader.tsx` (1 effect), spec `pagination-sync`.
- Verificación: gates verdes + revisión visual en los 3 temas.
