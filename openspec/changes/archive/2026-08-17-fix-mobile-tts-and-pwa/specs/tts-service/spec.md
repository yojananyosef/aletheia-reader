## Purpose

El servicio TTS gestiona la síntesis de voz para narración bíblica bimodal, incluyendo correcciones de comportamiento por plataforma y mecanismos de persistencia en background.

## MODIFIED Requirements

### Requirement: Safari Rate Correction

El servicio TTS SHALL detectar cuando se ejecuta en Safari/iOS y aplicar un factor de corrección al rate para compensar el bug conocido de WebKit que duplica o triplica la velocidad de reproducción.

#### Scenario: Rate correction en Safari iOS

WHEN el usuario configura una velocidad de 1.0x en Safari iOS
THEN el utterance se envía con un rate efectivo de ~0.55x para que el audio suene a velocidad natural

#### Scenario: Rate correction en Safari macOS

WHEN el usuario configura una velocidad de 1.5x en Safari macOS
THEN el utterance se envía con un rate efectivo de ~0.83x (1.5 * 0.55)

#### Scenario: Sin corrección en Chrome/Firefox

WHEN el usuario configura una velocidad de 1.0x en Chrome o Firefox
THEN el utterance se envía con el rate exacto configurado (1.0x) sin modificación

### Requirement: Android Keepalive Heartbeat

El servicio TTS SHALL implementar un mecanismo de heartbeat que reanude periódicamente el SpeechSynthesis en Android Chrome para evitar que el browser lo pause por inactividad percibida.

#### Scenario: Heartbeat durante reproducción activa

WHEN el TTS está en estado 'playing' en Android Chrome
THEN se emite un resume() cada ~10 segundos mientras el utterance actual sigue activo

#### Scenario: Heartbeat se detiene al pausar

WHEN el usuario pausa el TTS
THEN el heartbeat se detiene inmediatamente

### Requirement: Media Session Metadata

El servicio TTS SHALL configurar la Media Session API con metadata del versículo actual para que el sistema operativo trate el TTS como contenido de media, habilitando controles en la pantalla de bloqueo y notificaciones.

#### Scenario: Metadata se establece al iniciar versículo

WHEN comienza la reproducción de un versículo
THEN la Media Session metadata incluye título con libro, capítulo y versículo, y artista con "Alethia Reader"

#### Scenario: Acciones de media control

WHEN la Media Session está activa
THEN play, pause, previoustrack y nexttrack están habilitados y mapeados a las funciones TTS correspondientes
