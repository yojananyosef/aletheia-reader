# Proposal: reader-hygiene — Cero TODO-disables, cero código muerto, warnings a cero

## Why

El change anterior dejó 8 `TODO(reader-hygiene)` disables y el lint reporta 22 warnings (props muertas, imports sin uso, parámetros sin uso, deps incompletas). Es la fricción que impide refactors mayores (paginación, AAA).

## What (MVP — solo higiene, cero cambios de comportamiento)

- Borrar `components/reader/AudioNarratorBar.tsx` (0 imports; HUD activo es `ReaderFooter`).
- `ComfortBibleReader`: eliminar bloque redundante de hidratación TTS (el lazy `useState` ya lee storage → mata 1 error); disables razonados (no TODO) para sync-al-padre en mount, `onEnd` recursivo y nonce-en-cleanup; añadir `data.versionId` a deps; quitar import `TTSStatus` sin uso; dejar de pasar props muertas a Toolbar/Footer; calcular `totalWords` real desde `data.verses`.
- `app/page.tsx`: disables razonados (hidratación post-SSR — lazy init rompería el HTML del servidor — y fetch-pending estándar).
- `LineFocusOverlay`: `isDragging` ref → espejo en estado para la clase de transición (mismo batch que los `setState` existentes).
- `ReadingCanvas`: disable razonado (medición síncrona intencional, cero-flash) + justificación de deps granulares (evita repaginar en cambios de brillo/tema).
- `ReaderFooter`: quitar `onPrevPage/onNextPage` muertas + imports Chevron; mostrar `totalWords` real.
- `ReaderToolbar`: quitar `bookTitle/chapterNumber/onNextChapter/onPrevChapter` muertas (el padre conserva sus propios handlers).
- `tts-service`: `catch {` sin binding sin uso; quitar params `hasStarted/hasEnded` sin uso de `tryPiperFallback` (6 callsites).
- `piper-service`: quitar 3 type-imports sin uso + stub `onPiperProgress` sin callers.

## Non-Goals

- No tocar algoritmo de paginación, TTS, `framer-motion`, ni targets 44px (changes `perf-pagination` / `wcag-gaps`).
- No cablear `onNext/PrevVerseTTS` del Footer (feature, no higiene).
- No `--max-warnings=0` todavía (se activa cuando este change deje warnings en 0 y se mantenga).

## Impact

- Afecta: 4 componentes reader (1 borrado), `app/page.tsx`, `lib/tts|piper-service.ts`.
- Verificación: `bun run lint` 0 errores 0 warnings, `typecheck`, `test`, `build` en verde; checklist manual (cargar, cambiar capítulo, TTS play/stop, Line Focus drag).
