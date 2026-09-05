# Proposal: perf-pagination — Un TooltipProvider, portal a body, fingerprint robusto

## Why

Cada `<Tooltip>` crea su propio `TooltipProvider` (cientos por capítulo largo), el portal apunta al contenedor con `overflow:hidden` (recorta tooltips) y el fingerprint de paginación solo mira la primera página (cambios en versos medios con igual longitud no re-emiten `onPagesComputed` → TTS desincronizado).

## What (MVP — sin cambiar algoritmo de paginación)

- `ui/tooltip.tsx`: `Tooltip` renderiza solo `Root` (sin Provider propio); `TooltipContent` usa portal por defecto (`body`, sin recorte). Un único `TooltipProvider` (delay 250ms) en la raíz de `app/page.tsx` cubre explorador + lector.
- Quitar `delayDuration={500}` puntual (era prop de Provider mal pasada a Root; queda el default 250ms).
- Fingerprint por página: nº de versos + primer/último número + longitud total de texto (detecta cambios medios).

## Non-Goals

- No migrar paginación a worker ni unificar medida/render (siguiente change `pagination-worker` si el profiling lo pide).
- No tocar estilos ni comportamiento de TTS.

## Impact

- Afecta: `ui/tooltip.tsx`, `app/page.tsx`, `components/reader/ReadingCanvas.tsx` (2 líneas).
- Verificación: gates verdes, `rg TooltipProvider` 1 uso app + 1 def, checklist dev (tooltip versículo/nota/capítulo sin recorte, TTS sigue página).
