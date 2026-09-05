# pagination-sync Specification

## Purpose
Sincronización paginación↔TTS confiable y tooltips sin recorte ni sobrecarga de providers.

## Requirements

### Requirement: Robust pagination fingerprint

`onPagesComputed` SHALL re-emit whenever any page's verse set or text changes (per-page verse count, first/last verse number, total text length), not only when the first verse changes.

#### Scenario: Middle-verse change re-emits
- **WHEN** a middle verse text changes with identical length
- **THEN** a new fingerprint is computed and `onPagesComputed` fires again

### Requirement: Single tooltip provider without clipping

The app SHALL mount exactly one `TooltipProvider`, and tooltip content SHALL portal to `document.body` (never inside an `overflow:hidden` container).

#### Scenario: Footnote tooltip fully visible
- **WHEN** user hovers a footnote near the reading container edge
- **THEN** the tooltip renders complete, unclipped by the container
