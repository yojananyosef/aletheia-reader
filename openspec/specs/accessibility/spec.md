# accessibility Specification

## Purpose
Brechas WCAG 2.2 cerradas sin rediseño: objetivos táctiles AAA en chrome, teclado completo y regiones live únicas.

## Requirements

### Requirement: AAA touch targets in chrome

All out-of-text interactive controls SHALL expose ≥44px hit areas (via `.aaa-target` expansion or real `min-h-[44px]`). Inline verse/footnote markers are exempt per WCAG 2.5.5 Inline exception.

#### Scenario: Compact toolbar buttons
- **WHEN** measuring the clear-search or icon-sm buttons' clickable box
- **THEN** each dimension is ≥44px while visuals stay compact

### Requirement: Dialog focus containment

Open `Dialog` SHALL trap Tab/Shift+Tab inside and return focus to the invoker on close (Escape already closes).

#### Scenario: Tab cycles inside explorer
- **WHEN** explorer dialog is open and user tabs past the last control
- **THEN** focus wraps to the first control, never to the page behind

### Requirement: Keyboard-complete custom controls

Tabs SHALL expose tablist semantics with arrow-key navigation; VersionSelector and footer menus SHALL close on Escape; LineFocus shortcuts SHALL NOT fire from buttons, links, inputs or inside dialogs; search input SHALL have an accessible name.

#### Scenario: Space on focused button
- **WHEN** Line Focus is active and user presses Space on a focused button
- **THEN** the button activates instead of toggling focus lock

### Requirement: Single polite page announcer

Only `ReadingCanvas` SHALL announce page changes via live region; footnote triggers SHALL expose short labels (`Nota al pie · v{N}`); `PwmDimmer` SHALL render below dialogs/tooltips.

#### Scenario: One announcement per turn
- **WHEN** page changes with a screen reader running
- **THEN** exactly one polite announcement fires

### Requirement: AAA text contrast

Body, accent and muted text SHALL reach ≥7.0:1 in all three themes (measured 2026-09-05: pergamino 15.38/7.63/7.21, noche 14.20/7.70/7.58, sepia 13.17/7.38/7.31; verse numbers ≥7.2 via opacity .8). `lib/__tests__/contrast.test.ts` SHALL parse `app/globals.css` and enforce these floors. `PwmDimmer #000` is an accepted exception (light filter, never a surface).

#### Scenario: Contrast gate
- **WHEN** `bun run test` runs
- **THEN** all text token pairs assert ≥7.0:1
