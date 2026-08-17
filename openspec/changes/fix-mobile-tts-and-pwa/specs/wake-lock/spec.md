## Purpose

El servicio de Wake Lock gestiona la Screen Wake Lock API para mantener la pantalla activa durante la reproducción TTS, con fallback silencioso en navegadores que no soportan la API.

## ADDED Requirements

### Requirement: Wake Lock Activation

El sistema SHALL adquirir un Screen Wake Lock cuando el TTS entra en estado 'playing' y liberarlo cuando sale de ese estado.

#### Scenario: Wake lock se activa al iniciar narración

WHEN el usuario inicia la reproducción TTS
THEN se solicita un Screen Wake Lock y la pantalla permanece activa

#### Scenario: Wake lock se libera al pausar/detener

WHEN el TTS se pausa o detiene
THEN el Wake Lock se libera y la pantalla puede apagarse según la configuración del dispositivo

#### Scenario: Fallback silencioso

WHEN el navegador no soporta Screen Wake Lock API
THEN el sistema funciona sin Wake Lock sin errores ni impacto en la experiencia

### Requirement: Wake Lock Recovery

El sistema SHALL recuperar el Wake Lock automáticamente si se libera involuntariamente (por ejemplo, al cambiar de pestaña y volver).

#### Scenario: Recovería tras cambio de pestaña

WHEN el usuario regresa a la pestaña mientras el TTS reproduce
THEN se verifica si el Wake Lock sigue activo y se re-adquiere si fue liberado
