## 1. Preparación del contenedor de medición

- [x] 1.1 Agregar `useRef` al contenedor de versículos en ReadingCanvas para poder medir su scrollHeight
- [x] 1.2 Calcular `availableHeight` real del contenedor (clientHeight) considerando header, footer, y paddings

## 2. Lógica de detección de overflow

- [x] 2.1 Crear `useEffect` que mida `scrollHeight` vs `availableHeight` después de cada render de página
- [x] 2.2 Detectar si hay overflow (`scrollHeight > availableHeight`)
- [x] 2.3 Si no hay overflow, mantener versículos actuales sin cambios

## 3. Re-paginación completa basada en medición

- [x] 3.1 Cuando hay overflow, reconstruir TODAS las páginas usando medición real del DOM
- [x] 3.2 Medir cada página individualmente y distribuir versículos直到 que quepa
- [x] 3.3 Almacenar las páginas medidas en estado separado (`measuredPages`)

## 4. Integración con renderizado

- [x] 4.1 Usar `measuredPages` cuando esté disponible, fallback a `estimatedPages`
- [x] 4.2 Mantener algoritmo de estimación como hint inicial (rápido)
- [x] 4.3 Los versículos excedentes se pasan correctamente a la siguiente página

## 5. Verificación

- [x] 5.1 TypeScript compila sin errores
- [x] 5.2 Build de producción exitoso
- [x] 5.3 Linter pasa sin errores nuevos
