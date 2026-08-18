## Why

Con fuentes grandes (24-28px), el algoritmo de paginación estima mal cuánto cabe en una página. El resultado: versículos largos se recortan con `overflow: hidden` y el usuario no puede leer el contenido completo. El problema empeora con lineHeight alto y viewport pequeño.

## What Changes

- Agregar medición post-render del contenido real para detectar overflow
- Mover versículos excedentes a la siguiente página cuando el contenido no cabe
- Mantener el algoritmo de estimación como intento inicial (no reemplazar, solo corregir)

## Capabilities

### New Capabilities

- `reactive-pagination`: Paginación que mide el contenido renderizado y ajusta dinámicamente la cantidad de versículos por página para evitar overflow

### Modified Capabilities

_(none)_

## Impact

- `components/reader/ReadingCanvas.tsx`: Modificar el algoritmo de paginación y agregar measurement post-render
- No se rompen APIs, dependencias o contratos existentes
