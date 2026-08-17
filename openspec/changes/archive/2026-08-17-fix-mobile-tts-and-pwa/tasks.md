# Tasks: Fix Mobile TTS + Line Focus Mobile + PWA

## Task 1: Safari Rate Correction
- [x] Detectar Safari/iOS en `lib/tts-service.ts` usando user agent + feature detection
- [x] Definir constante `SAFARI_RATE_FACTOR = 0.55`
- [x] Aplicar factor de corrección en `speakVerse()` antes de asignar `utterance.rate`
- [x] Verificar que el rate se muestra correctamente en la UI (el usuario ve 1.0x pero suena natural)

## Task 2: Android Keepalive Heartbeat
- [x] Agregar propiedad `keepaliveInterval: NodeJS.Timeout | null` a la clase BibleTTSService
- [x] Crear método `startKeepalive()` que ejecute `synth.resume()` cada 10 segundos mientras `synth.speaking`
- [x] Crear método `stopKeepalive()` que limpie el interval
- [x] Llamar `startKeepalive()` en `speakVerse()` después de `synth.speak()`
- [x] Llamar `stopKeepalive()` en `pause()`, `cancel()` y dentro de `onend`/`onerror`

## Task 3: Media Session Integration
- [x] En `speakVerse()`, configurar `navigator.mediaSession.metadata` con título del versículo
- [x] Mapear `navigator.mediaSession.setActionHandler('play', ...)` a `synth.resume()`
- [x] Mapear `navigator.mediaSession.setActionHandler('pause', ...)` a `synth.pause()`
- [x] Mapear `navigator.mediaSession.setActionHandler('previoustrack', ...)` al callback de versículo anterior
- [x] Mapear `navigator.mediaSession.setActionHandler('nexttrack', ...)` al callback de versículo siguiente
- [x] Guardar callbacks de prev/next en refs para acceso desde Media Session handlers

## Task 4: Wake Lock Service
- [x] Crear `lib/wake-lock-service.ts` con clase WakeLockService singleton
- [x] Implementar `request()`: solicitar Screen Wake Lock, manejar errores silenciosamente
- [x] Implementar `release()`: liberar sentinel si existe
- [x] Implementar `reacquire()`: verificar y re-adquirir si fue liberado (para visibilitychange)
- [x] Agregar listener de `visibilitychange` para re-adquirir wake lock al volver a la pestaña

## Task 5: Wake Lock Integration in Reader
- [x] Importar `wakeLockService` en `ComfortBibleReader.tsx`
- [x] Llamar `wakeLockService.request()` en `handlePlayTTS()` y `speakVerseAtIndex()` cuando status === 'playing'
- [x] Llamar `wakeLockService.release()` en `handlePauseTTS()`, `handleStopTTS()` y en cleanup del effect
- [x] Liberar wake lock en el cleanup del effect de chapter change

## Task 6: Line Focus Touch Drag Rewrite
- [x] Agregar estado `isDragging` (ref) al LineFocusOverlay
- [x] En `handleTouchStart`: activar `isDragging`, desactivar transiciones CSS
- [x] En `handleTouchMove`: mantener sin transiciones, throttlear con RAF (mín 16ms entre updates)
- [x] En `handleTouchEnd`: desactivar `isDragging`, reactivar transiciones
- [x] Aumentar umbral de movimiento para activar drag de 0 a 8px (evitar conflictos con taps)
- [x] Reducir umbral de tap de 10px a 8px y tiempo de 500ms a 300ms
- [x] Agregar debounce al `forwardPointerEvent` para evitar clicks fantasma
- [x] Usar `touch-action: none` en el root div para mejor compatibilidad

## Task 7: PWA - Manifest
- [x] Crear `app/manifest.ts` con Metadata API de Next.js
- [x] Configurar name: "Alethia Reader", short_name: "Alethia", display: standalone
- [x] Agregar theme_color y background_color según tema pergamino
- [x] Agregar icons array con 192px y 512px
- [x] Agregar apple-touch-icon y apple-mobile-web-app-capable para iOS

## Task 8: PWA - Service Worker
- [x] Instalar `@serwist/next` y `@serwist/window`
- [x] Crear `app/sw.ts` con Serwist: NetworkFirst para navigations, CacheFirst para JSON/fonts
- [x] Configurar `next.config.ts` con `withSerwistInit`
- [x] Crear `components/ServiceWorkerRegister.tsx` para registro en producción
- [x] Agregar componente al layout.tsx

## Task 9: PWA - Iconos
- [x] Generar `public/icon-192.png` (placeholder con iniciales "AR")
- [x] Generar `public/icon-512.png` (placeholder con iniciales "AR")
- [x] Verificar que los iconos son válidos para manifest

## Task 10: Verify & Lint
- [x] Ejecutar `bun run build` y verificar que compila sin errores
- [x] Ejecutar `bun run lint` y verificar que pasa
- [x] Verificar que `openspec validate` sigue pasando después de los cambios
