# Proposal: contrast-palette — Contraste de texto AAA real (≥7:1) sin rediseño

## Why

Medición 2026-09-05: acentos y muted de pergamino/sepia y muted noche están entre 5.09 y 6.96 (AA sí, AAA no), y `verse-super` a opacity .55 da 3.62 efectivo. El README admite AAA parcial; este change lo lleva a CUMPLE en 1.4.6 manteniendo la familia terracota/bronce.

## What (MVP)

- `app/globals.css`: pergamino `--accent #74471B` (7.63) y `--muted #555555` (7.21); sepia `--accent #74401F` (7.38) y `--muted #544D43` (7.31); noche `--muted #ABABAB` (7.58). Acento noche intacto (7.70). `verse-super opacity .8` (8.16/9.46/7.22 por tema).
- `ui/button.tsx`: fuera `focus-visible:ring-2` (queda el outline global 3px, unifica 2.4.13).
- `PwmDimmer #000`: excepción documentada (filtro de luz, no superficie).
- `lib/__tests__/contrast.test.ts`: parsea `globals.css` y exige ≥7.0 en pares de texto + blend de verse-super.
- README: fila 1.4.3/1.4.6 a CUMPLE con ratios medidos.

## Non-Goals

- No cambiar hue/familia de paleta ni layout.
- No tocar tipografías, targets ni paginación.
- No subir `tsconfig target ES2017` (el test evita flag `s`/APIs modernas por esto; bump a ES2022 en change posterior).

## Impact

- Afecta: `globals.css`, `button.tsx`, 1 test nuevo, README, spec `accessibility`.
- Verificación: gates verdes + revisión visual del usuario (tonos apenas más oscuros, números más presentes).
