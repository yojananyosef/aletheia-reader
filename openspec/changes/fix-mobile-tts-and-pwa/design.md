# Design: Fix Mobile TTS + Line Focus Mobile + PWA

## Technical Approach

### 1. Safari Rate Correction (`lib/tts-service.ts`)

**Problema**: WebKit en Safari/iOS duplica o triplica el `SpeechSynthesisUtterance.rate` internamente.

**Solución**: Detectar Safari mediante `navigator.userAgent` + `CSS.supports(-webkit-touch-callout)` y aplicar un factor de corrección de `0.55` al rate antes de enviar el utterance.

```typescript
// Detección
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Corrección
const SAFARI_RATE_FACTOR = 0.55;
const effectiveRate = isSafari ? rate * SAFARI_RATE_FACTOR : rate;
```

Se aplicará en `speakVerse()` antes de asignar `utterance.rate`.

### 2. Android Keepalive + Media Session (`lib/tts-service.ts`)

**Keepalive**: Usar `setInterval` con 10 segundos que llame a `synth.resume()` mientras `synth.speaking === true`. El interval se limpia al pausar/detener/cambiar de utterance.

**Media Session**: Configurar `navigator.mediaSession.metadata` con título del versículo y mapear acciones play/pause/previoustrack/nexttrack a los callbacks del servicio TTS.

### 3. Wake Lock Service (`lib/wake-lock-service.ts`)

Wrapper singleton de la Screen Wake Lock API:

```typescript
class WakeLockService {
  private sentinel: WakeLockSentinel | null = null;
  
  async request(): Promise<void> {
    if (!('wakeLock' in navigator)) return;
    try {
      this.sentinel = await navigator.wakeLock.request('screen');
      this.sentinel.addEventListener('release', () => { this.sentinel = null; });
    } catch { /* silent */ }
  }
  
  async release(): Promise<void> {
    if (this.sentinel) await this.sentinel.release();
  }
}
```

Se integra en `ComfortBibleReader.tsx`: `request()` al iniciar TTS, `release()` al pausar/detener.

### 4. Line Focus Touch Drag Rewrite (`components/reader/LineFocusOverlay.tsx`)

**Problemas actuales**:
- `transition-all duration-150` crea lag visual durante drag
- `forwardPointerEvent` en touchend puede causar clicks fantasma
- Throttling con RAF puede acumular frames en dispositivos lentos

**Solución**:
1. **Estado `isDragging`**: Nuevo boolean que se activa en touchstart y desactiva en touchend
2. **Sin transiciones durante drag**: Cuando `isDragging === true`, la clase de transición se elimina del todo el overlay (máscara superior, inferior y apertura)
3. **Throttling con RAF mejorado**: Usar un ref `lastRafTime` para asegurar al menos 16ms entre actualizaciones
4. **Umbral de movimiento**: No activar drag hasta > 8px de delta para evitar conflictos con taps
5. **Click forwarding con debounce**: Solo forwardar click si el touch fue un tap real (delta < 8px, tiempo < 300ms, sin movimiento significativo)

### 5. PWA con Serwist

**Dependencias**: `@serwist/next`, `@serwist/window`

**Archivos**:
- `app/manifest.ts`: Manifest dinámico con Next.js Metadata API
- `app/sw.ts`: Service worker con Serwist handlers (NetworkFirst para navigations, StaleWhileRevalidate para assets, CacheFirst para fonts/JSON)
- `components/ServiceWorkerRegister.tsx`: Registro del SW solo en producción
- `next.config.ts`: Envolver con `withSerwistInit`
- `public/icon-192.png` + `public/icon-512.png`: Iconos placeholder

**Caching strategy**:
- `/*.json` (bible data): CacheFirst con expiration de 30 días
- `/_next/static/**`: StaleWhileRevalidate
- Fonts: CacheFirst
- Navegación: NetworkFirst con fallback offline

## Architecture Changes

### Nuevos archivos
| Archivo | Tipo | Propósito |
|---------|------|-----------|
| `lib/wake-lock-service.ts` | Service | Wake Lock API wrapper |
| `app/manifest.ts` | Route | Web App Manifest |
| `app/sw.ts` | Service Worker | Offline caching |
| `components/ServiceWorkerRegister.tsx` | Component | SW registration |
| `public/icon-192.png` | Asset | PWA icon |
| `public/icon-512.png` | Asset | PWA icon |

### Archivos modificados
| Archivo | Cambios |
|---------|---------|
| `lib/tts-service.ts` | Safari rate correction, keepalive heartbeat, Media Session |
| `components/reader/LineFocusOverlay.tsx` | Touch drag rewrite, isDragging state, sin transiciones durante drag |
| `components/reader/ComfortBibleReader.tsx` | Wake lock integration |
| `next.config.ts` | Serwist wrapper |
| `app/layout.tsx` | Metadata manifest + SW register component |
| `package.json` | Nuevas dependencias @serwist/next, @serwist/window |

## Testing Strategy

1. **Safari iOS**: Verificar rate en Safari iOS con diferentes velocidades (0.75x, 1.0x, 1.5x, 2.0x)
2. **Android Chrome**: Verificar TTS continúa al apagar pantalla 5-10 segundos; Media Session aparece en notificación
3. **Line Focus mobile**: Verificar drag suave en iOS Safari y Android Chrome sin lag
4. **PWA**: Verificar instalación en home screen (iOS y Android), offline caching, manifest válido
5. **Desktop**: Verificar que nada cambia en Chrome/Firefox desktop (regression testing)
