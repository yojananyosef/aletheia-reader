## Purpose

Sistema de paginación que mide el contenido renderizado y ajusta dinámicamente la cantidad de versículos por página para evitar que el contenido se recorte con overflow.

## ADDED Requirements

### Requirement: Medición post-render de overflow

El sistema SHALL medir la altura real del contenido renderizado después de cada cambio de página y detectar si excede el espacio disponible en el viewport.

#### Scenario: Contenido cabe en viewport

- **WHEN** se renderiza una página con versículos que caben en el espacio disponible
- **THEN** la página se muestra completa sin recortes

#### Scenario: Contenido excede viewport

- **WHEN** se renderiza una página cuya altura real excede el espacio disponible
- **THEN** el sistema detecta el overflow y ajusta la página removiendo el último versículo

### Requirement: Re-particionamiento dinámico

Cuando se detecta overflow, el sistema SHALL mover el último versículo de la página actual a la siguiente página, y repetir hasta que el contenido quepa.

#### Scenario: Un versículo largo excede la página

- **WHEN** un solo versículo tiene texto suficiente para exceder la altura disponible
- **THEN** el versículo se coloca solo en una página y se muestra completo (sin recorte)

#### Scenario: Múltiples versículos exceden la página

- **WHEN** el grupo acumulado de versículos excede la altura disponible
- **THEN** el sistema remueve versículos del final de la página hasta que el contenido quepa

### Requirement: Mantener algoritmo de estimación

El sistema SHALL mantener el algoritmo actual de estimación por conteo de caracteres como intento inicial, usando la medición post-render solo como corrección.

#### Scenario: Estimación es precisa

- **WHEN** la estimación inicial produce una página que cabe en el viewport
- **THEN** no se realiza medición adicional (se mantiene el rendimiento actual)

#### Scenario: Estimación falla

- **WHEN** la estimación inicial produce una página que no cabe
- **THEN** se activa el mecanismo de medición y re-particionamiento

### Requirement: Continuidad de versículos partidos

Cuando un versículo se divide entre páginas, el número del versículo solo aparece en la primera página. La siguiente página continúa con el texto sin número de versículo al inicio.

#### Scenario: Versículo dividido entre páginas

- **WHEN** un versículo largo se parte entre dos páginas
- **THEN** la primera página muestra el número de versículo, la segunda página muestra solo el texto continuación
