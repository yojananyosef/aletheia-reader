# Proposal: ci-pipeline — Gates en cada push/PR

## Why

9 commits se subieron sin red: lint/typecheck/test/build solo corren en local. Un workflow que los exija evita regresiones silenciosas.

## What (MVP)

- `.github/workflows/ci.yml`: job único en `ubuntu-latest` con `oven-sh/setup-bun`, pasos `bun install`, `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`. Trigger push a `main` + pull requests.
- `package.json`: `"lint": "eslint . --max-warnings=0"` (hoy 0 warnings; el gate lo mantiene).

## Non-Goals

- No e2e ni deploy en este paso.
- No caché de Piper assets remota.

## Impact

- Afecta: `.github/workflows/ci.yml`, `package.json`.
- Verificación: gates locales verdes + YAML válido.
