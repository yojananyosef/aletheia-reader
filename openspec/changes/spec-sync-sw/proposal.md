# Proposal: spec-sync-sw — Sincronizar specs con SW aletheia-v2 + banner

## Why

Los commits `849e8ee` (otra sesión) subieron el caché a `aletheia-v2` con banner de update, pero las specs `brand-identity` y `bible-versions` aún dicen v1/v3. Docs mentirosas otra vez.

## What (MVP)

- `specs/brand-identity`: CACHE_NAME `aletheia-v2`, limpieza de `alethia-*`/`aletheia-v1`, banner vía `sw-update-available`.
- `specs/bible-versions`: caché v2 (era v3 en el texto viejo).
- Sin cambios de código.

## Non-Goals

- No tocar SW ni registro.

## Impact

- Afecta: 2 specs. Verificación: `openspec validate` + gates.
