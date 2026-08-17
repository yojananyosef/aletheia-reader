## 1. Type & Storage Updates

- [x] 1.1 Add `letterSpacing: number`, `bionicReading: boolean`, `phoneticDots: boolean` to `ReaderSettings` in `types/bible.ts`
- [x] 1.2 Update `storage-service.ts` to merge default values for missing keys on load (backward-compatible migration)
- [x] 1.3 Update `storage-service.ts` default settings constant with new fields: `letterSpacing: 0.02`, `bionicReading: false`, `phoneticDots: false`

## 2. Text Transform Utilities

- [x] 2.1 Create `lib/text-transforms.ts` with `applyBionicReading(text: string): string` — splits each word into bold-prefix (`<strong>`) and normal suffix based on ~40% fixation length
- [x] 2.2 Add `applySyllablePoints(text: string): string` — rule-based Spanish syllable splitter that inserts mid-dot (·) between syllables
- [x] 2.3 Add unit tests for both transforms (edge cases: single-char words, punctuation, accented characters, empty strings)

## 3. Settings Panel UI

- [x] 3.1 Add letter-spacing slider to `ReaderSettingsPanel` (range 0–0.1em, step 0.01, default 0.02em, label "Espaciado")
- [x] 3.2 Extend line-height slider range from 1.4–2.0 to 1.2–2.5 (keep step 0.1, default 1.6)
- [x] 3.3 Add "Lectura Biónica" toggle switch with subtitle "Resalta puntos de fijación sacádica"
- [x] 3.4 Add "Puntos Silábicos" toggle switch with subtitle "Facilita decodificación fonológica"
- [x] 3.5 Add "Restaurar valores" button that resets fontSize(18), lineHeight(1.6), letterSpacing(0.02), fontWeight(400), bionicReading(false), phoneticDots(false)
- [x] 3.6 Reorder settings panel: Font Size → Line Height → Letter Spacing → separator → Bionic Reading → Syllable Points → separator → Restore button

## 4. Reading Canvas Integration

- [x] 4.1 Import and apply text transforms in `ReadingCanvas` verse rendering pipeline — call `applyBionicReading` and/or `applySyllablePoints` based on settings before rendering verse text
- [x] 4.2 Apply `letterSpacing` and `lineHeight` as CSS custom properties on the reading canvas root element, updated reactively when settings change
- [x] 4.3 Verify transforms compose correctly when both Bionic Reading and Syllable Points are active simultaneously

## 5. CSS & Styling

- [x] 5.1 Add CSS custom property `--reader-letter-spacing` to `globals.css` for letter-spacing, applied to the reading canvas text container
- [x] 5.2 Ensure `line-height` CSS property accepts values outside previous 1.4–2.0 range (no clamping in CSS)
- [x] 5.3 Style toggle switches and sliders to match existing reader settings panel design language

## 6. Verification

- [x] 6.1 Run `npx tsc --noEmit` — no type errors
- [x] 6.2 Run `bun run build` — successful build
- [x] 6.3 Manual test: toggle Bionic Reading on/off, verify text transforms correctly
- [x] 6.4 Manual test: toggle Syllable Points on/off, verify Spanish syllable mid-dots appear
- [x] 6.5 Manual test: adjust letter-spacing slider, verify visual change and persistence
- [x] 6.6 Manual test: click restore defaults, verify all typography settings reset
- [x] 6.7 Manual test: load app with old localStorage (no new keys), verify defaults applied without error
