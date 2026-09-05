# Proposal: deps-motion — Next 16.3.3 (security) y adiós a framer-motion

## Why

`framer-motion ^13.1.0` (rama next inestable, import deprecado) solo produce 3 fades de 100–150ms, y uno de ellos anima el canvas de lectura violando la regla `dyslexia-eink-agent-rules` (never animations inside reading container) y el propio README ("transiciones instantáneas"). `next 16.3.0` está detrás del security release `16.3.3`.

## What (MVP)

- `bun add next@16.3.3 eslint-config-next@16.3.3`, `bun remove framer-motion`.
- `ReadingCanvas`: `AnimatePresence/motion.div` → `div` plano con la misma `key` (paginación instantánea real).
- `ReaderToolbar`/`ReaderFooter`: show/hide con clase de entrada CSS (`toolbar-in 150ms`, `controls-in 120ms` en `globals.css`); salida instantánea al desmontar (sin librería no hay exit-anim sin retener DOM; tradeoff documentado).
- `prefers-reduced-motion` existente ya anula las nuevas animaciones (verificado).

## Non-Goals

- No rediseñar transiciones ni añadir librerías de animación.
- No tocar paginación, TTS ni layout.

## Impact

- Afecta: `package.json`, `bun.lock`, 3 componentes, `app/globals.css`, contexto OpenSpec.
- Verificación: `lint/typecheck/test/build` verdes, `rg framer-motion` cero hits, checklist dev (paginación, toolbar toggle, footer).
