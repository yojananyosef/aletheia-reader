# tooling Specification

## Purpose
Puerta de calidad mínima del repo: lint, typecheck y tests unitarios ejecutables y en verde, sin ruido de assets generados ni dependencias de test muertas.

## Requirements

### Requirement: Quality gate scripts

The system SHALL expose `bun run lint` (`eslint .`), `bun run typecheck` (`tsc --noEmit`) and `bun run test` (`vitest run`), all exiting 0 on a clean tree. Generated assets (`public/worker|onnx|piper`, `public/data`) SHALL be excluded from lint via `eslint.config.mjs`.

#### Scenario: Clean tree passes gates
- **WHEN** contributor runs `bun run lint && bun run typecheck && bun run test` on main
- **THEN** all three exit 0 (lint may report warnings, zero errors)

### Requirement: Typed TTS boundary

`lib/piper-service.ts`, `lib/tts-service.ts` and `lib/utils.ts` SHALL contain zero `no-explicit-any` errors. The `piper-tts-web` module SHALL have ambient types in `types/piper.d.ts` matching its real exports. Intentional React-compiler exceptions SHALL carry `TODO(reader-hygiene)` disables.

#### Scenario: No any regressions
- **WHEN** `bun run lint` runs
- **THEN** zero `no-explicit-any` errors are reported
