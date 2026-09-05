# Proposal: fix-lint-test-scripts — `bun run lint/test/typecheck` en verde y con sentido

## Why

`bun run lint` es `"eslint"` sin path (frágil) y `eslint .` da 62 errores / ~3000 warnings: la mayoría ruido de assets de terceros copiados (`public/worker|onnx|piper/*.js`, miles de warnings), más 31 `any` reales en `lib/` y `bun run test` inexistente (`vitest` importado en `lib/__tests__` pero no instalado). Sin red de seguridad no hay refactors posibles.

## What (MVP — solo tooling + tipos, cero cambios de comportamiento)

- `eslint.config.mjs`: ignorar `public/worker/**`, `public/onnx/**`, `public/piper/**`, `public/data/**`, `coverage/**`, `playwright-report/**`, `test-results/**`.
- `package.json`: `"lint": "eslint ."`, `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`; `bun add -D vitest`; `bun remove playwright @playwright/test` (0 imports, sin config ni specs; e2e se re-añade con config cuando haya specs).
- `tsconfig.json`: quitar `lib/__tests__` de `exclude` para que `tsc` cubra los tests.
- `lib/utils.ts`, `lib/tts-service.ts`, `lib/piper-service.ts`, `types/piper.d.ts`: eliminar 31 `no-explicit-any` con tipos reales (módulo Piper tipado, `Window._activeBibleUtterance`, `SpeakVerseOptions`, `TTSError`, eventos DOM/EasySpeech). Sin cambiar lógica.
- `scripts/test-pagination.js`: header `eslint-disable no-require-imports` (script CJS directo de node).
- 8 violaciones del compilador React (setState-en-effect de hidratación inicial, refs en render) quedan con `eslint-disable` puntual + `TODO(reader-hygiene)`: son patrones intencionales hoy; su refactor va en change posterior.
- `.gitignore`: `coverage/`, `playwright-report/`, `test-results/`.

## Non-Goals

- No refactorizar hidratación inicial, paginación ni TTS (change `reader-hygiene` posterior).
- No añadir specs e2e ni config Playwright en este paso.
- No poner `--max-warnings=0` (warnings remanentes se atacan en `reader-hygiene`).

## Impact

- Afecta: `eslint.config.mjs`, `package.json`, `bun.lock`, `tsconfig.json`, `.gitignore`, `lib/*.ts`, `types/piper.d.ts`, `scripts/test-pagination.js`, 4 disables puntuales en `app/page.tsx`, `components/reader/*`.
- Verificación: `bun run lint` exit 0, `bun run typecheck` exit 0, `bun run test` en verde, `bun run build` OK.
