## Purpose

Higiene del lector: sin código muerto, sin disables pendientes y lint con cero errores y cero warnings, sin cambiar comportamiento de lectura, paginación ni TTS.

## ADDED Requirements

### Requirement: No dead reader code

The system SHALL contain no unreferenced reader components or unreferenced props. `AudioNarratorBar` (superseded by `ReaderFooter` HUD) SHALL NOT exist. `ReaderToolbar` SHALL NOT declare `bookTitle/chapterNumber/onNextChapter/onPrevChapter`; `ReaderFooter` SHALL NOT declare `onPrevPage/onNextPage`.

#### Scenario: No dead references
- **WHEN** reviewer searches `AudioNarratorBar`, `bookTitle`, `onPrevPage` outside history (`openspec/changes/archive/`)
- **THEN** zero matches in `app/`, `components/`, `lib/`, `types/`

### Requirement: Documented intentional lint exceptions

Every `eslint-disable` in reader code SHALL carry a reason comment (SSR hydration, sync zero-flash measurement, intentional recursion, monotonic nonce). No `TODO(reader-hygiene)` disables SHALL remain.

#### Scenario: Clean lint with reasons
- **WHEN** `bun run lint` runs
- **THEN** zero errors, zero warnings, and each disable line includes its rationale

### Requirement: Truthful reading-time estimate

`ReaderFooter` SHALL display minutes computed from the actual chapter word count passed as `totalWords`, not a hardcoded constant.

#### Scenario: Real estimate
- **WHEN** a chapter with ~4000 words renders
- **THEN** footer shows `~20 min` (ceil(words/200), min 1)
