# Proposal: wcag-gaps — Cerrar brechas AAA sin rediseño visual

## Why

Auditoría 2026-09-04: targets <44px, Dialog sin focus-trap, tabs sin roles, popovers sin Esc, LineFocus roba Espacio a botones, doble aria-live, footnote labels verbosos, PwmDimmer sobre modales. README ya admite AAA parcial; este change cierra lo cerrable sin cambiar el diseño.

## What (MVP)

- `.aaa-target` en `globals.css` (hit-area 44px vía `::after`, visual intacto) aplicado a variantes `Button` <44px, close de Dialog, triggers y opciones de menús del Footer (estos últimos con `min-h-[44px]` real, sin restricción inline). Números de versículo/notas inline: exentos por excepción "Inline" de WCAG 2.5.5 (documentado, sin cambio).
- `Dialog`: focus-trap + retorno de foco (Esc ya existía).
- `Tabs`: roles tablist/tab/tabpanel, `aria-selected`, roving tabindex con flechas.
- `VersionSelector` y menús del Footer: Esc cierra.
- `LineFocusOverlay`: Espacio y flechas se ignoran sobre botones/enlaces/inputs y dentro de diálogos.
- Search del explorador: `aria-label`; sliders con `id`+`htmlFor`.
- Un solo `aria-live` de página (canvas); footnote label corto `Nota al pie · v{N}`.
- `PwmDimmer` z 70→45 (debajo de diálogos/tooltips/toasts).

## Non-Goals

- No cambiar paleta de acentos (contraste 5.21:1) ni opacidad de verse-super: rediseño posterior `contrast-palette`.
- No cablear `onNext/PrevVerseTTS` ni tocar paginación/TTS.

## Impact

- Afecta: `globals.css`, `ui/{button,dialog,tabs,slider}`, 5 componentes reader, `app/page.tsx`.
- Verificación: gates verdes, checklist teclado (Tab/Esc/flechas/Espacio) + visual intacto.
