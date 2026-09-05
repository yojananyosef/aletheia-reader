# Proposal: rename-to-aletheia — Corregir marca Alethia→Aletheia + documentación veraz

## Why

El nombre actual `Alethia` es un error gramatical: la palabra griega es **ἀλήθεια (alētheia)** = verdad/desocultamiento. Mantener `Alethia` (sin segunda E) daña credibilidad del proyecto, rompe búsquedas y contradice el dominio `aletheia`. Además el README declara cumplimientos que el código no sostiene (AAA total, 44px todos, Bookerly real, atajos 6/6, estructura desactualizada), lo que genera deuda de confianza. Este change corrige la marca con migración segura y deja la documentación veraz.

## What (MVP — solo renombre + docs, sin refactors)

- Renombre en código: `package.json:name`, `app/manifest.ts` (name/short_name), `app/layout.tsx` (metadata + tooltip container id), `README.md` (título + badges), comentarios `Alethia` en `Toolbar/Footer/ComfortBibleReader`.
- Storage: claves `alethia_*` → `aletheia_*` con **lectura dual** (lee nueva, fallback vieja, migra al guardar). Sin pérdida de posición/marcadores/TTS de usuarios existentes. Ver `lib/storage-service.ts:3-9`.
- PWA: `CACHE_NAME alethia-v3` → `aletheia-v1` + en `activate` borrar cachés `alethia-*` viejas. Ver `public/sw.js:1,30-37`.
- Tooltip portal id `alethia-reader-container` → `aletheia-reader-container` (`components/ui/tooltip.tsx:9`).
- Docs veraces en README: Bookerly = fallback (solo Literata/Atkinson/OpenDyslexic reales), targets = AA cumplido / AAA parcial (base 36-40px), atajos reales (flechas + Esc + swipe; quitar Espacio/Alt+/clic-central o marcar no implementado), estructura real (`public/data/bibles/9 versiones/`, sin `sample-biblical-data.ts`), documentar TTS Piper+EasySpeech existente, añadir `LICENSE` MIT + campo `license`.
- NO toca: `public/data/bibles/*/bible.json` (contenido bíblico, solo si menciona marca), `bun.lock` (se regenera solo), carpeta git `alethia-reader/` (renombre OS al final, fuera de este change).

## Non-Goals

- No cambiar comportamiento de lectura, paginación, TTS ni estilos.
- No subir a 44px todos los botones ni a AAA total (eso va en change posterior `wcag-aaa-gaps`).
- No eliminar `framer-motion` ni tocar paginación (change posterior `perf-pagination`).
- No renombrar carpeta del repo ni remote en este paso.

## Impact

- Afecta: `package.json`, `app/manifest.ts`, `app/layout.tsx`, `components/ui/tooltip.tsx`, `lib/storage-service.ts`, `lib/tts-service.ts:178` (comentario album), `public/sw.js`, `README.md`, `LICENSE` (nuevo), `openspec/*` (referencias históricas se mantienen como archivo, no se reescriben).
- Riesgo principal: pérdida de storage/caché si no hay migración dual → mitigado con fallback + tests de migración.
- Verificación: `bun run build`, `bunx tsc --noEmit`, `bunx @fission-ai/openspec validate rename-to-aletheia`, checklist manual (cargar con storage viejo → migra; SW actualiza sin pantalla blanca).
