# bible-versions Specification

## Purpose
Provee selección de traducción bíblica entre 9 versiones en español (8×66 y Platense×73), con persistencia por versión, cache on-demand y flag deuterocanónicos, preservando paginación discreta, TTS y confort E-Ink.

## Requirements

### Requirement: Catálogo de 9 versiones españolas disponible

The system SHALL expose 9 Spanish translations sourced from `alethia-gateway` (`RV1909`, `BES`, `VBL`, `PDDPT`, `ONBV`, `BLL`, `BLM`, `SpaPlatense`, `SpaRVG`) with metadata (name, shortName, copyright, hasDeuterocanonical) loaded from `public/data/bibles/manifest.json` (filtered `language==='es'`).

#### Scenario: Listado ES completo
- **WHEN** app loads `getAvailableTranslations()`
- **THEN** returns 9 entries including `SpaPlatense` with `hasDeuterocanonical:true` and 8 with `false`

#### Scenario: Default ONBV
- **WHEN** no `alethia_selected_version` in storage
- **THEN** selected version is `ONBV`

### Requirement: Fetch version-aware on-demand

The system SHALL fetch book data from `public/data/bibles/{versionId}/{BOOK}.json` on demand, cached by composite key `versionId:bookCode`. Switching version SHALL fetch only the active book (not all 73×9).

#### Scenario: Switch version fetches single book
- **WHEN** user switches from `ONBV` to `RV1909` while reading `GEN 1`
- **THEN** only `RV1909/GEN.json` is fetched, other books remain not fetched

#### Scenario: Chapter pagination adapts
- **WHEN** version text length differs (e.g. VBL longer)
- **THEN** `ReadingCanvas` recomputes pagination automatically (dep on `versionId`)

### Requirement: Adapter gateway dict → reader array

The system SHALL adapt gateway format (`chapters: Record<string, {verses: {number,text,verseDisplay,endNumber,headings}}>`) to reader `RawBookData` (`chapters: RawChapter[]` with `sections` from `headings`, `verses` number→string, `verseDisplay` preserved).

#### Scenario: Headings become sections
- **WHEN** gateway verse has `headings:["La creación"]`
- **THEN** adapted chapter has `sections: [{title:"La creación", beforeVerse: number}]`

### Requirement: Version selector UI non-breaking

The system SHALL render a version pill `ONBV ▼` in `ReaderToolbar` (left group, 44px, `focus-visible`) and a mirrored card grid in Settings Drawer section 0 "Traducción". Both SHALL share `selectedVersionId` state.

#### Scenario: Change via pill
- **WHEN** user picks `RVG` from pill dropdown
- **THEN** reader reloads current `bookId/chapter` in `RVG`, persists `alethia_selected_version`, and pagination resets to page 1 (or verse target if exists)

#### Scenario: Platense badge
- **WHEN** `SpaPlatense` selected
- **THEN** Explorer header shows badge `73 libros · +7 deuterocanónicos` and book list includes `TOB,JDT,1MA,2MA,BAR,SIR,WIS`

### Requirement: Storage versioning with migration

Bookmarks and reading positions SHALL be tagged with `versionId`. Legacy entries without `versionId` SHALL be treated as `ONBV`. Switching version SHALL not mix positions.

#### Scenario: Legacy migration
- **WHEN** existing `alethia_reading_position` lacks `versionId`
- **THEN** on load it is interpreted as `ONBV` and next save includes `versionId`

#### Scenario: Bookmarks filtered by version
- **WHEN** viewing bookmarks while on `BES`
- **THEN** only `BES` bookmarks shown by default (toggle "todas" optional future)

### Requirement: PWA cache version-aware

Service worker cache SHALL be `aletheia-v2` and cache `.json` by full URL including `versionId`, using on-demand `cache.put` (no precache of 60M).

#### Scenario: SW caches per version
- **WHEN** `RV1909/GEN.json` fetched
- **THEN** SW caches it under `.../RV1909/GEN.json` distinct from `ONBV/GEN.json`

### Requirement: Backward-compatible bible-service overloads

`getBibleBooks()` and `getChapterData(bookId, chapter)` without `versionId` SHALL continue to work defaulting to `ONBV` (deprecated but functional).

#### Scenario: Legacy call defaults to ONBV
- **WHEN** caller invokes `getChapterData('GEN', 1)` without `versionId`
- **THEN** chapter data resolves from `ONBV/GEN.json`
