## Purpose

Movimiento mínimo y honesto: paginación instantánea dentro del canvas de lectura y animaciones sutiles solo fuera de él, siempre anulables por `prefers-reduced-motion`, sin librerías de animación.

## ADDED Requirements

### Requirement: Instant page turns

Page changes in `ReadingCanvas` SHALL render with no opacity/transform transition (plain `div` keyed by book-chapter-page).

#### Scenario: Turn page
- **WHEN** user advances page
- **THEN** new page content appears immediately with no fade or slide

### Requirement: Subtle chrome motion only

Toolbar show/hide and footer controls expansion SHALL use CSS entry animations (≤150ms) and honor `prefers-reduced-motion: reduce` (zero motion).

#### Scenario: Reduced motion
- **WHEN** OS requests reduced motion and toolbar toggles
- **THEN** no visible animation occurs
