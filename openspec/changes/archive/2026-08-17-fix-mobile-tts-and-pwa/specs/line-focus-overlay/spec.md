## Purpose

El overlay de enfoque de línea proporciona un mecanismo de asistencia TDAH que enmascara la pantalla para aislar 1, 3 o 5 líneas de texto, siguiendo el cursor o manteniéndose fijo, con soporte de arrastre táctil en móviles.

## MODIFIED Requirements

### Requirement: Touch Drag Smoothness

El overlay SHALL procesar eventos táctiles de arrastre sin transiciones CSS durante el movimiento activo, aplicando la posición instantáneamente para eliminar lag visual.

#### Scenario: Drag fluido en móvil

WHEN el usuario toca y arrastra verticalmente en un dispositivo con puntero coarse
THEN la apertura de enfoque sigue el dedo sin retraso perceptible ni efecto de "pegado"

#### Scenario: Transición se desactiva durante drag

WHEN un evento touchstart se activa en el overlay
THEN las transiciones CSS se desactivan hasta que touchend se dispare

#### Scenario: Transición se reactiva al soltar

WHEN el usuario suelta el dedo (touchend)
THEN las transiciones CSS se reactivan para movimientos por botones o teclado

### Requirement: Touch vs Tap Discrimination

El overlay SHALL discriminar correctamente entre arrastre vertical (movimiento de apertura), swipe horizontal (cambio de página) y tap (selección de versículo), evitando clicks fantasma.

#### Scenario: Swipe horizontal cambia página

WHEN el usuario realiza un flick horizontal con delta > 35px en < 600ms
THEN se ejecuta el cambio de página y NO se procesa como arrastre vertical

#### Scenario: Tap forwarda al canvas

WHEN el usuario toca sin mover (< 10px delta, < 500ms)
THEN el toque se forwarda como click al elemento debajo del overlay para selección de versículo

#### Scenario: Arrastre vertical mueve apertura

WHEN el usuario toca y mueve verticalmente con delta > 10px
THEN la apertura sigue el movimiento sin forwardar clicks

### Requirement: Pointer Events Management

El overlay SHALL usar pointer-events-none en el overlay raíz con pointer-events-auto solo en botones interactivos, permitiendo que los toques atraviesen el overlay hacia el contenido debajo cuando no son arrastres.

#### Scenario: Toque atraviesa overlay

WHEN el usuario toca una zona del overlay que no es botón ni arrastre
THEN el evento llega al elemento del DOM debajo del overlay
