# brand-identity Specification

## Purpose
Define la identidad de marca correcta **Aletheia** (griego ἀλήθεια) y el contrato de migración sin pérdida desde `alethia`, más documentación veraz de lo que el sistema realmente cumple (auditoría 2026-09-04).

## Requirements

### Requirement: Brand spelling Aletheia

The system SHALL display brand name `Aletheia` (with E) in PWA manifest (`name`, `short_name`), HTML metadata, README title, and visible UI strings. Internal code identifiers MAY keep legacy spelling only where migration risk exists and MUST be documented.

#### Scenario: Manifest shows Aletheia
- **WHEN** browser installs the PWA or reads `/manifest.webmanifest`
- **THEN** `name` contains `Aletheia Reader` and `short_name` is `Aletheia`

#### Scenario: No visible Alethia without E
- **WHEN** reviewer searches visible strings (`app/`, `components/reader/`, `README.md`)
- **THEN** no occurrence of `Alethia` (case-insensitive, excluding historical `openspec/changes/archive/` and bible content JSON) remains

### Requirement: Storage migration without loss

Storage keys SHALL move from `alethia_*` to `aletheia_*`. Read path SHALL try `aletheia_*` first and fall back to `alethia_*`; write path SHALL persist only `aletheia_*`. Legacy entries without `versionId` keep existing `ONBV` default.

#### Scenario: Existing user keeps position
- **WHEN** user with only `alethia_reading_position` opens the app after update
- **THEN** reader restores same book/chapter and next save writes `aletheia_reading_position` with `versionId`

#### Scenario: Fresh user writes new keys only
- **WHEN** user without any stored keys changes settings
- **THEN** only `aletheia_*` keys are created, no `alethia_*` keys appear

### Requirement: Service worker cache migration

`CACHE_NAME` SHALL be `aletheia-v2`. On `activate` the worker SHALL delete caches starting with `alethia-` (legacy brand) or `aletheia-v1`, keeping only `aletheia-v2`. When a new worker installs while an older one controls the page, the app SHALL show an update banner (via `sw-update-available`) instead of silently swapping.

#### Scenario: Update cleans old cache
- **WHEN** SW `aletheia-v2` activates in a client cached by `aletheia-v1` or `alethia-v3`
- **THEN** old caches are gone, bible JSON re-caches on demand under `aletheia-v2`, and the banner offers the update

### Requirement: Truthful README

README SHALL state: typography = Literata (Bookerly only as fallback string, no file), touch targets = WCAG AA met / AAA partial (base 36–40px, only `icon-lg` reaches 44px), shortcuts = arrows + Escape + swipe supported (Space/Alt+/middle-click NOT implemented), structure = `public/data/bibles/{9}/` (no `sample-biblical-data.ts`, no `public/json/`), TTS = EasySpeech primary + Piper WASM fallback documented, and MIT license file present.

#### Scenario: Claims match audit
- **WHEN** reviewer contrasts each README claim with code (`globals.css`, `ui/button.tsx`, `ReadingCanvas.tsx`, `LineFocusOverlay.tsx`)
- **THEN** no claim marked NO CUMPLE in audit 2026-09-04 remains stated as fulfilled
