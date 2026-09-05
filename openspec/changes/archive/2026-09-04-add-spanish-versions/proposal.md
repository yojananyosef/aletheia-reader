# Proposal: add-spanish-versions — Selector de 9 Versiones Españolas (con flag deuterocanónicos)

## Why

Alethia Reader es hoy mono-versión (ONBV `spaonbv` hardcodeado en `lib/bible-service.ts:43`). Para pasar al siguiente nivel necesitamos soporte multi-versión sin romper el confort neurocognitivo, WCAG AAA ni PWA. El proyecto hermano `alethia-gateway` ya normaliza 9 versiones en español (6–14M cada una) con formato gateway dict; reusarlas evita reconversión y licencias dispersas.

## What (MVP — single-version selector, con puerta a paralelo)

- Sincronizar 9 versiones ES desde `../alethia-gateway/public/data/bibles/{RV1909,BES,VBL,PDDPT,ONBV,BLL,BLM,SpaPlatense,SpaRVG}` a `public/data/bibles/` con `manifest.json` filtrado ES.
- Mantener estructura gateway intacta (`chapters: Record<string, {verses}>`, `verseDisplay`, `headings`) y adaptar en `bible-service` via adapter (dict→array, number→string, headings→sections).
- Cache on-demand por `(versionId, bookCode)` con `Map` (no bundle 60M). SW `cache-first` on-demand, bump `CACHE_NAME`.
- Types: `TranslationId` (9), `TranslationMeta` (copia de gateway `Translation.ts:45` con `hasDeuterocanonical`), `versionId` en `ChapterPayload`, `ReaderTarget`, `StoredReadingPosition`, `StoredBookmark`.
- Storage: `alethia_selected_version` (default `ONBV`), posiciones y bookmarks taggeados por `versionId` con migración legacy `spaonbv → ONBV` y envoltorio sin versión → `ONBV`.
- UI: pill `ONBV ▼` en `ReaderToolbar` (izquierda, antes de 🔊) + espejo en `Settings Drawer` sección 0 "Traducción" (cards grid). Explorador muestra badge `PLATENSE +7 deuterocanónicos` cuando `hasDeuterocanonical`. Todo `min-h 44px`, `focus-visible`.
- `SpaPlatense` 73 libros: soportar catálogo dinámico por versión (66 vs 73), navegación y paginación ya recalculan por `versionId`.

## Non-Goals

- No vista paralela/split en este change (preparado, no implementado).
- No API remota (estático `public/`).
- No migrar versiones en otros idiomas (solo ES).
- No re-generar JSON al formato legacy reader.

## Impact

- Afecta `types/bible.ts`, `lib/bible-service.ts`, `lib/storage-service.ts`, `app/page.tsx`, `components/reader/ReaderToolbar.tsx`, `public/sw.js`.
- Sin ruptura: overloads sin `versionId` delegan a `ONBV`, migración storage, fallback `public/json/*` → `public/data/bibles/ONBV`.
