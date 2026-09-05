## ADDED Requirements

### Requirement: AAA text contrast

Body, accent and muted text SHALL reach ≥7.0:1 in all three themes (measured 2026-09-05: pergamino 15.38/7.63/7.21, noche 14.20/7.70/7.58, sepia 13.17/7.38/7.31; verse numbers ≥7.2 via opacity .8). `lib/__tests__/contrast.test.ts` SHALL parse `app/globals.css` and enforce these floors. `PwmDimmer #000` is an accepted exception (light filter, never a surface).

#### Scenario: Contrast gate
- **WHEN** `bun run test` runs
- **THEN** all text token pairs assert ≥7.0:1
