## Why

Alethia Reader targets neurocognitive comfort (WCAG 2.2 AAA), but lacks two evidence-based dyslexia aids — Bionic Reading (saccadic fixation points) and Syllable Points (phonological decoding) — that the reference NRVA-Reader already implements. Additionally, the current `ReaderSettings` type is missing `letterSpacing` (espaciado entre letras) and the typography defaults (lineHeight 1.6, letterSpacing 0.02em) are hardcoded without a restore-defaults mechanism. These gaps prevent users with dyslexia or visual processing differences from customizing the reading experience to their needs.

## What Changes

- **Bionic Reading mode**: Toggle that bolds the first N letters of each word to create saccadic fixation anchors, reducing regressions and improving reading speed for dyslexic users.
- **Syllable Points mode**: Toggle that inserts visible mid-dot separators (·) between syllables in Spanish text to support phonological decoding.
- **Adjustable letter-spacing**: New `letterSpacing` setting (0em–0.1em, default 0.02em) with slider in the settings panel.
- **Adjustable line-height range**: Extend existing `lineHeight` range to 1.2–2.5 (currently 1.4–2.0) with the same slider UX.
- **Restore defaults button**: Reset all typography settings (fontSize, lineHeight, letterSpacing, fontWeight, bionicReading, phoneticDots) to their recommended defaults in one action.
- **Persist new settings**: `letterSpacing`, `bionicReading`, and `phoneticDots` added to localStorage via `storage-service`.

## Capabilities

### New Capabilities
- `reading-aids/dyslexia-tools`: Bionic Reading and Syllable Points text transformation modes — toggle-based features that transform rendered verse text to support saccadic fixation and phonological decoding.
- `reading-settings/typography-controls`: Adjustable letter-spacing and line-height settings with restore-defaults, including the UI controls (sliders, reset button) and localStorage persistence.

### Modified Capabilities
_(none — these are new capabilities with no prior spec)_

## Impact

- **Types**: `ReaderSettings` in `types/bible.ts` gains `letterSpacing`, `bionicReading`, `phoneticDots`.
- **Components**: `ReaderSettingsPanel` (new sliders + toggles + reset), `ReadingCanvas` or verse renderer (applies bionic/syllable transforms), `ComfortBibleReader` (passes new settings down).
- **Storage**: `storage-service.ts` handles new keys with backward-compatible migration.
- **CSS**: `globals.css` applies `letter-spacing` and extended `line-height` range via CSS custom properties.
- **No API/backend changes**: All transformations are client-side text rendering.
