## Context

Alethia Reader is a client-side Next.js Bible reader with paginated reading, theme/font selection, and ADHD line focus. The `ReaderSettings` type currently holds `theme`, `font`, `fontSize`, `lineHeight`, `softwareBrightness`, `lineFocus`, `showToolbar`, and `fontWeight`. localStorage persistence is handled by `storage-service.ts`. The NRVA-Reader reference app (Astro/Preact) already implements Bionic Reading, Syllable Points, letter-spacing, and a restore-defaults button — we adapt these patterns to our React/TypeScript stack.

## Goals / Non-Goals

**Goals:**
- Add `letterSpacing`, `bionicReading`, and `phoneticDots` to `ReaderSettings`
- Implement Bionic Reading as a text-transform utility (bold prefix per word)
- Implement Syllable Points as a text-transform utility (mid-dot at syllable boundaries)
- Add letter-spacing slider and extended line-height range to settings panel
- Add a single "Restaurar defaults" button that resets all typography settings
- Backward-compatible localStorage migration (missing keys get defaults)

**Non-Goals:**
- Server-side rendering of transformed text (all transforms are client-side)
- Word-spacing adjustment (not requested for this change)
- Language-aware syllabification beyond Spanish (English syllabification has different rules)
- Adjustable Bionic Reading fixation percentage (hardcoded at ~40%)

## Decisions

### 1. Text transform as pure utility functions, not React components
**Decision**: Bionic Reading and Syllable Points are implemented as pure `text → text` utility functions in `lib/text-transforms.ts`, called during verse rendering in `ReadingCanvas`.

**Rationale**: These transforms are stateless, deterministic, and composable. Making them utility functions keeps the rendering pipeline simple — `ReadingCanvas` applies `applyBionicReading(text)` and/or `applySyllablePoints(text)` before rendering. This avoids wrapper components and DOM overhead.

**Alternatives considered**:
- *React component wrapper* (`<BionicText>`) — Rejected: adds unnecessary DOM nodes and makes CSS inheritance harder.
- *CSS-only approach* — Not possible: bold-prefix requires splitting text into `<span>` elements.

### 2. Spanish syllabification via rule-based algorithm
**Decision**: Implement a rule-based Spanish syllable splitter in `lib/text-transforms.ts` using standard Spanish phonological rules (vowel clusters, consonant-vowel patterns, dipthongs/triphthongs).

**Rationale**: Spanish syllabification follows consistent, well-documented rules unlike English. A rule-based approach avoids external dependencies and works offline. The algorithm handles common patterns: CV, CVC, consonant clusters (pr, bl, cr), hiatus/diphthong resolution.

**Alternatives considered**:
- *Pre-computed dictionary* — Rejected: would need to cover all words in the Bible corpus (~32k unique words), maintenance burden.
- *External NLP library* — Rejected: adds bundle weight, dependency risk, offline concerns.

### 3. Restore defaults scope: typography settings only
**Decision**: The restore button resets `fontSize` (18), `lineHeight` (1.6), `letterSpacing` (0.02), `fontWeight` (400), `bionicReading` (false), and `phoneticDots` (false). It does NOT reset `theme`, `font`, `softwareBrightness`, or `lineFocus`.

**Rationale**: Theme and font are personal preference choices, not accessibility defaults. Typography settings are the "comfort calibration" surface — resetting them to evidence-based defaults is the intended use case.

### 4. CSS custom properties for dynamic typography
**Decision**: Apply `letter-spacing` and `line-height` via CSS custom properties on the reading canvas root, updated reactively when settings change.

**Rationale**: CSS custom properties cascade naturally, avoid inline style thrashing, and are efficiently updated by the browser's style recalculation. This matches the existing pattern for `fontSize`.

## Risks / Trade-offs

- **[Syllable accuracy edge cases]** → Spanish has rare loanwords and proper nouns where rules may produce non-standard splits. Mitigation: the mid-dot is purely visual — incorrect splits don't break functionality, just reduce the aid's effectiveness. Can be improved iteratively.

- **[Bionic Reading performance]** → Splitting every word into `<span>` elements increases DOM node count. Mitigation: transforms are only applied to visible text (current page), not the full chapter. With 50-60 CPL and ~20 lines per page, worst case is ~600 extra `<span>` nodes — negligible for modern browsers.

- **[localStorage migration]** → Existing users get new defaults silently. Mitigation: defaults are non-breaking (letterSpacing 0.02em is subtle, toggles are off). No existing settings are overwritten.

## Migration Plan

1. Update `ReaderSettings` type with new fields
2. Update `storage-service.ts` to merge defaults for missing keys on load
3. Add text-transform utilities to `lib/text-transforms.ts`
4. Integrate transforms into `ReadingCanvas` verse rendering
5. Update settings panel UI with new sliders, toggles, and restore button
6. Apply CSS custom properties for `letter-spacing` and `line-height`

No database migrations, no API changes, no breaking changes to existing functionality.

## Open Questions

_(none — all design decisions are resolved)_
