# Proposal: Fix Mobile TTS Issues + Line Focus Mobile Lag + PWA Implementation

## Why

### Background

Alethia Reader es un lector bíblico web diseñado para confort neurocognitivo y accesibilidad WCAG 2.2 AAA. Actualmente tiene tres problemas que afectan la experiencia en dispositivos móviles:

1. **iOS Safari: audio TTS acelerado** — El `SpeechSynthesisUtterance.rate` se duplica o triplica en Safari/iOS debido a un bug conocido de WebKit. Los usuarios reportan que el audio suena extremadamente rápido en iPhones.

2. **Android: TTS no reproduce / se detiene al apagar pantalla** — En algunos dispositivos Android el TTS no inicia. En los que sí reproduce, se detiene cuando la pantalla se apaga porque Chrome en Android pausa el SpeechSynthesis al ir a background.

3. **Line Focus mobile: drag laggy y buggeado** — El overlay de enfoque de línea (TDAH) funciona perfecto en desktop con mouse, pero en móvil el drag táctil se siente retrasado, se "pega" y a veces registra múltiples toques. La transición CSS de 150ms crea un efecto de lag visual durante el arrastre.

### Impact

- **iOS Safari**: ~25-30% de usuarios móviles afectados (todos los iPhone)
- **Android**: Dispositivos con battery optimization agresiva (Samsung, Pixel, OnePlus)
- **Line Focus mobile**: Todos los usuarios TDAH en móvil no pueden usar la funcionalidad core
- **PWA**: Sin instalación en home screen, sin offline, experiencia de app nativa inexistente

### Success Criteria

1. iOS Safari: rate de TTS suena natural (no acelerado) sin importar la velocidad configurada
2. Android: TTS continúa reproduciendo al apagar pantalla brevemente; Wake Lock mantiene pantalla activa durante narración
3. Line Focus: drag táctil suave y responsive sin lag visual; sin clicks fantasma
4. PWA: App instalable desde home screen en iOS y Android; offline caching de assets estáticos

## What

### Scope

**Incluido:**
- Corrección de rate TTS para Safari/iOS (factor de corrección ~0.55)
- Servicio de Wake Lock API con fallback silencioso
- Media Session API para background audio en Android
- Keepalive heartbeat para SpeechSynthesis en Android
- Reescritura del touch drag en LineFocusOverlay (sin transiciones durante drag, throttling optimizado)
- PWA completa: manifest, service worker (Serwist), iconos, offline caching

**No incluido:**
- Cambios en la lógica de paginación
- Nuevos modos de color o fuentes
- Backend/API (la app sigue siendo 100% client-side)

### Capabilities Affected

| Capability | Cambio |
|---|---|
| TTS Service | Rate correction para Safari, keepalive heartbeat, Media Session |
| Wake Lock | Nuevo servicio `lib/wake-lock-service.ts` |
| Line Focus Overlay | Reescritura de touch drag handlers |
| PWA | Manifest, Service Worker, SW Register, iconos |
| Reader Container | Integración de Wake Lock con estado TTS |
| Root Layout | Metadata manifest + SW register |
| Next Config | Integración Serwist |
