# SPEC (futuro): Reader ← aletheia-catalog (.amod / AMF v1)

> Estado: **propuesta documentada, sin implementar**. Prerrequisito: el catálogo debe
> publicar primero las versiones en español (hoy solo ASV, KJV, SME, SMITH).
> Decisión registrada 2026-09-05: upstream oficial = `aletheia-catalog`
> (spec gemelo en `alethia-gateway/docs/future-catalog-integration.md`;
> ambos lectores convergen al mismo catálogo unificado de distribución).

## 1. Objetivo

Sacar los ~64MB de `public/data/` (+6.4MB legacy en `public/json/`) del repo sin
cambiar el runtime: el lector sigue consumiendo **JSON por libro** vía `fetch`.
El catálogo es el *source of truth* versionado; un ETL convierte `.amod` → JSON
actual y lo publica donde el reader lo lea.

Explícitamente NO: leer SQLite/WASM en el navegador. El runtime no toca `.amod`.

## 2. Punto de partida (verificado 2026-09-05)

- Stack: Next.js 16 + React 19 + TS (`package.json`: `aletheia-reader` v0.1.0).
- Datos: `public/data/bibles/{BES,BLL,BLM,ONBV,PDDPT,RV1909,SpaPlatense,SpaRVG,VBL}/`
  + `manifest.json` (+ legacy `public/json/bible.json` solo ONBV, en transición).
- Carga (`lib/bible-service.ts`, con guards runtime — conservar el patrón
  "gateway data is fetched, never trusted"):
  - catálogo: `/data/bibles/{versionId}/bible.json` → fallback legacy → `manifest.json`,
  - capítulos: `/data/bibles/{vid}/{book}.json`, con `fetch` race-safe (signal).
- Particularidades vs gateway: PWA (`public/sw.js`), `worker/` (17M), TTS
  onnx/piper offline. El Service Worker cachea datos: cualquier cambio de origen
  exige versionar la caché del SW (ver §4.3).

## 3. Trabajo previo en el catálogo (lado catálogo, antes de tocar el reader)

1. Importar lote ES: RV1909, BES, VBL, PDDPT, ONBV, BLL, BLM, SpaPlatense, SpaRVG
   (las 9 que usa este reader — idéntico requisito que el gateway).
2. Publicar release, regenerar `catalog.json` (sha256), mapear
   `id catálogo ↔ versionId reader` (hoy coinciden en mayúsculas: verificar).
3. Cerrar la transición ONBV (`public/json/bible.json` legacy): el ETL debe producir
   el path versionado para ONBV y permitir eliminar el legacy.

## 4. Diseño de integración (lado reader)

### 4.1. `DATA_BASE_URL` centralizado (Next.js)
- Env `NEXT_PUBLIC_DATA_BASE_URL` (default `''` = `/data` local actual).
- Centralizar en `lib/bible-service.ts`: un `buildDataUrl(path)` + `fetchJsonWithFallback()`
  (remoto → fallback `/data/...` empaquetado). Mantener guards runtime y `signal`.
- `manifest.json`: resolver primero remoto, fallback local (igual que `bible.json` hoy).

### 4.2. ETL `.amod` → JSON reader (reusar el del gateway)
- El ETL del gateway ya define el esquema por libro; este reader usa layout
  compatible (`{vid}/{book}.json` + `bible.json` agregado por versión + `manifest.json`).
  Compartir el job (mismo repo de tooling o paso CI duplicado) con flag de formato
  reader (incluye `bible.json` agregado si el reader lo sigue necesitando).
- Verificar licencias/attribution por módulo igual que en gateway.

### 4.3. PWA y caché
- Versionar el `CACHE_NAME` del SW con el sha/commit del dataset (hoy el SW puede
  servir datos viejos tras un cambio de origen).
- `worker/` y modelos onnx/piper NO migran (son runtime, no datos bíblicos).

## 5. Criterios de aceptación

1. `git clone` del reader sin `public/data` en crecimiento; `public/json` legacy eliminado.
2. Tests existentes (`lib/__tests__`, e2e Playwright del repo) en verde contra datos
   remotos (staging del catálogo).
3. Paridad de contenido: 0 diffs en versículos ES entre JSON actual y generado
   (muestra: GEN, PSA, JHN, REV × 9 versiones).
4. Offline: con el remoto caído, fallback local + SW sirven el subset empaquetado.
5. Licencias visibles por versión (igual que gateway).

## 6. Riesgos y notas

- CORS en assets de Releases: verificar antes de fetch directo; si falla, ETL en CI
  + hosting con CORS (el ETL no tiene restricción CORS).
- `aletheia-modules` solo como referencia de inventario (binarios en-repo, sin spec).
- Compartir el ETL entre gateway y reader evita divergencia de esquemas: cualquier
  cambio de formato se versiona una vez y se prueba en ambos (paridad §5.3).
