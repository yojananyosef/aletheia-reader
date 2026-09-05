## MODIFIED Requirements

### Requirement: Single tooltip provider without clipping

The app SHALL mount exactly one `TooltipProvider`, tooltip content SHALL portal to `document.body` (never inside an `overflow:hidden` container), and tooltips SHALL resolve the active reader theme. The active theme class (`theme-pergamino|noche|sepia`) SHALL be mirrored to `document.body` so body-portalled content inherits `--reader-*` variables.

#### Scenario: Footnote tooltip fully visible
- **WHEN** user hovers a footnote near the reading container edge
- **THEN** the tooltip renders complete, unclipped by the container

#### Scenario: Tooltip follows active theme
- **WHEN** theme is Sepia and user hovers any tooltip trigger
- **THEN** tooltip background, text and border use the Sepia tokens (`--bg-sepia`, `--text-sepia`, `--border-sepia`)
