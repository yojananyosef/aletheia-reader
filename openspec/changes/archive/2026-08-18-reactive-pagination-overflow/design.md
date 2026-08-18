## Context

El algoritmo de paginación en `ReadingCanvas.tsx` estima la capacidad de página usando `linesPerPage * effectiveCPL` (conteo de caracteres). Con fuentes grandes (24-28px), la estimación es imprecisa y el overflow se recorta silenciosamente con `overflow: hidden`.

El algoritmo actual:
1. Calcula CPL basado en ancho de viewport y font size
2. Calcula líneas por página basado en alto de viewport
3. Acumula versículos hasta exceder la capacidad estimada
4. Renderiza sin verificar si el contenido realmente cabe

## Goals / Non-Goals

**Goals:**
- Detectar overflow post-render y ajustar dinámicamente
- Mantener el algoritmo de estimación como optimización
- Preservar la experiencia de páginas discretas sin scroll
- Manejar versículos que exceden una página completa

**Non-Goals:**
- Cambiar la experiencia de lectura (páginas, no scroll)
- Modificar el algoritmo de estimación existente
- Agregar scroll virtual o lazy loading
- Cambiar la interfaz de usuario del lector

## Decisions

### Decision 1: Medición post-render con useRef + scrollHeight

**Enfoque**: Usar un ref en el contenedor de versículos y medir `scrollHeight` vs `clientHeight` después del render.

**Alternativa considerada**: Medición por JavaScript off-screen (crear elemento oculto, medir, eliminar). Descartada porque no accounts for word-wrapping real del navegador.

**Razón**: `scrollHeight` refleja la altura real que el navegador necesita, incluyendo word-wrapping, padding, y margins. Es la fuente de verdad más confiable.

### Decision 2: Algoritmo de remoción iterativo

**Enfoque**: Si hay overflow, remover el último versículo y re-medir. Repetir hasta que quepa.

**Alternativa considerada**: Calcular la proporción `(availableHeight / scrollHeight) * versesCount` para estimar cuántos versículos caben. Descartada porque no es preciso con versículos de longitud variable.

**Razón**: La remoción iterativa es O(n) en el peor caso (un verso por página) pero garantiza resultado correcto. Con pocos versículos por página (típico 3-8), el loop es trivial.

### Decision 3: Mantener la estimación como hint

**Enfoque**: El algoritmo actual se ejecuta primero. Solo si el render resultante excede el viewport, se activa la corrección.

**Alternativa considerada**: Reemplazar la estimación completamente con medición. Descartada porque requeriría renderizar múltiples veces para cada página potencial.

**Razón**: La estimación es barata (aritmética) y produce buen resultado la mayoría de las veces. La corrección solo se ejecuta cuando falla, que es infrecuente con fuentes pequeñas/medianas.

### Decision 4: Ref para medición con useEffect

**Enfoque**: Usar `useRef` en el contenedor de versículos y `useEffect` que se dispare después de cada cambio de página para medir y ajustar.

**Implementación**:
```tsx
const contentRef = useRef<HTMLDivElement>(null);
const [adjustedVerses, setAdjustedVerses] = useState<Verse[]>([]);

useEffect(() => {
  if (!contentRef.current) return;
  const el = contentRef.current;
  const availableHeight = el.clientHeight;
  let verses = [...activeVerses];
  
  // Si el contenido cabe, no hacer nada
  if (el.scrollHeight <= availableHeight) {
    setAdjustedVerses(verses);
    return;
  }
  
  // Remover versículos hasta que quepa
  while (verses.length > 1 && el.scrollHeight > availableHeight) {
    verses = verses.slice(0, -1);
    // Re-render temporal para medir
    el.textContent = verses.map(v => v.text).join(' ');
  }
  
  setAdjustedVerses(verses);
}, [activeVerses, settings.fontSize, viewportDimensions]);
```

## Risks / Trade-offs

- **[Performance]** Medición post-render agrega un re-render extra por página → Mitigación: Solo se ejecuta cuando la estimación falla (infrecuente con fuentes normales)
- **[Flash de contenido]** El contenido podría parpadear al ajustarse → Mitigación: Usar opacity 0 durante el ajuste, o medir en un elemento off-screen
- **[Versículos huérfanos]** Si un versículo largo se parte, la siguiente página podría empezar con poco contenido → Mitigación: Aceptable, es cómo funcionan los libros físicos
- **[Loop infinito]** Si el viewport es demasiado pequeño para cualquier contenido → Mitigación: Límite mínimo de 1 versículo por página
