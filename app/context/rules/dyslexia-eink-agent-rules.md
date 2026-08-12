---
description: Aplicar siempre que se editen, creen o estilicen componentes de lectura de texto, interfaces de visualización o archivos CSS/JSX relacionados con el lector de la app.
globs: src/components/**/*Reader*, src/styles/eink*
---

# SYSTEM DESIGN & UX INSTRUCTIONS: Comfortable Reading & E-Ink Emulation
## Target: AI Code Generation & UI/UX Design Agents (Agent Roadmap / `skill.md`)

This document serves as an **authoritative roadmap and rule-set** for any AI agent tasked with building, modifying, or maintaining interfaces destined for extended reading, cognitive accessibility, or E-ink simulation on emissive screens (LCD/OLED). 

You **MUST** strictly adhere to the biomechanical, neurocognitive, and technical rules detailed below to prevent visual fatigue (asthenopia), reduce cognitive load, and ensure compliance with **WCAG 2.2 AAA** standards.

---

## 1. THE CORE PHILOSOPHY: REPRODUCING PHYSICAL REFLECTIVENESS
Standard LCD and OLED screens project photons directly into the reader's retina (backlight) [63, 365]. This continuous light emission causes pupillary instability, tear film dryness, and accommodation strain [63, 333, 365].
Your goal is to emulate **electrophoretic physical paper behavior** (reflection of ambient light instead of direct projection) [61, 62, 364, 365].

### The Three Golden Rules of Luminescence:
1. **Never use pure white (`#FFFFFF`) or pure black (`#000000`)** [73, 296]. High contrast on emissive displays causes ocular glare and "halation" (blooming of text) [73, 296, 385].
2. **Target Contrast Ratio of 12:1 to 15:1** [74, 75, 296]. This range exceeds the WCAG 2.2 AAA minimum of 7:1 for legibility [75, 296], while preventing retinal glare [74, 75].
3. **Use Chromatic Softness**: Apply warm, desaturated background tones to absorb high-energy blue light (415–455 nm) [74]:
   * **Light Theme Canvas**: Warm Cream/Pergamino (`#FDFBF6` or `#F5EFEB`) [74, 297].
   * **Light Theme Text**: Charcoal/Gris Carbón (`#222222` or `#1A1A18`) [74, 297].
   * **Dark Theme Canvas**: Deep Matte Charcoal (`#1A1A1a`) [297].
   * **Dark Theme Text**: Warm White (`#E8E8E8`) [297].

---

## 2. ATTAINING PWM FLICKER-FREE DIMMING VIA SOFTWARE
When users lower brightness via hardware, displays often activate Pulse Width Modulation (PWM) [341, 480], triggering rapid on-off cycles that cause neurological strain and headaches [268, 333, 342].

### Agent Implementation Rule (Software-Based Dimming):
* **Do NOT** let the user lower physical hardware brightness below its safe threshold (usually ~40–50%) [268].
* **DO** apply a **Software Brightness Multiplier via GPU** [269, 344, 383].
* Implement a multiplier $M_{dimming} \in [0.0, 1.0]$ applied as a color transform in the compositor/GPU [269, 384]:
  $$C_{out} = C_{in} \cdot M_{dimming}$$
* This allows the display hardware to run in its non-flicker range [344, 345, 383] while rendering a perfectly dim, comfortable image for night reading [268, 269, 384].

---

## 3. PROCEDURAL PAPER-GRAIN OVERLAY (ANTI-GLARE SIMULATION)
To break the clinical, flat emission of pixels, you must overlay a subtle, non-interactive procedural paper texture using SVG and CSS blend modes [75, 387, 388]. This diffuses the specular reflection [75, 388].

```xml
<!-- SVG Paper Noise Filter -->
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <filter id="paperNoise">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
    <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.05 0" />
    <feBlend mode="multiply" in="SourceGraphic" />
  </filter>
</svg>
```

### CSS Overlay Application:
* Apply to a `::before` pseudo-element with `pointer-events: none` [75, 77].
* Use `mix-blend-mode: multiply` for light backgrounds and `mix-blend-mode: screen` (or opacity adjustments) for dark mode [75].

---

## 4. MAQUETACIÓN ERGONÓMICA Y LÍMITES SACCADIC (50–60 CPL)
Micro-saccades are ocular jumps [77]. Excessively long lines force large return saccades, losing the reader's line tracking [77, 293]; lines that are too short fragment reading [77].

* **Longitud de Línea Estricta**: Limit content width to **50 to 60 characters per line (CPL)** (`max-width: 60ch` or `65ch` in CSS) [77, 293, 294].
* **Alineación Obligatoria**: **Always use left alignment (`text-align: left`)** [77, 294, 295]. Never use `text-align: justify` [294]. Justification creates "rivers of white" [68, 294, 370], confusing the reader and intensifying visual crowding [69, 294].
* **Ángulo Visual Seguro**: Base font size must be $\ge 16\text{px}$ ($1\text{rem}$) to ensure a visual angle of at least $0.3^\circ$ at standard reading distances (45–60 cm) [77].
* **Interlineado Despejado**: Set line-height strictly to **`1.5em` to `1.6em`** (`line-height: 1.6`) [77, 293, 299] to prevent overlaps of ascenders/descenders [77].
* **Márgenes de Aislamiento**: Maintain a lateral safety column of **10% to 15%** of the screen width to isolate text from hardware borders [77].

---

## 5. ACCESIBILIDAD COGNITIVA: TIPOGRAFÍAS DE ALTO RENDIMIENTO
Different neural deficits require distinct typographic solutions. You must integrate and support dynamic switching of these three layout styles:

### A. Bookerly (Serif Premium de Kindle) [65, 373]
* **Purpose**: Extended, fatigue-free reading [66, 126, 373].
* **Anatomía de Diseño**: Wide, slightly squared counters (interior spaces of 'o', 'e', 'a') [66, 373]. This stops physical ink-spread (or pixel blur) from closing the letter forms [66, 373].
* **Hinting**: Rounded, asymmetric, robust serifs that anchor characters to pixel grids securely [67, 373].

### B. Atkinson Hyperlegible (Sans-Serif de Accesibilidad) [81, 101, 374]
* **Purpose**: Low vision, aging, cognitive reading fatigue [81, 99, 101, 102].
* **Anatomía de Diseño**: Focuses on character distinction over aesthetic uniformity [82, 101, 139].
* **Anti-Homoglyph Mechanics**:
  * Capital "I" has top and bottom serifs (unlike "T") to differentiate from lowercase "l" and number "1" [85, 374].
  * Capital "F" middle bar is elongated to prevent confusion with "E" [85, 374].
  * Asymmetric spurs on "b" and "d" to prevent mental flipping [276, 374].
  * Elongated descender on "q" to distinguish from "p" [276, 277].

### C. OpenDyslexic (Especializada en Dislexia) [69, 374]
* **Purpose**: Prevents character rotation, mirroring, and text-floating [69, 374, 377].
* **Anatomía de Diseño**: Asymmetrical bottom-heavy weighting on every character [69, 374]. This acts as a visual gravity anchor telling the brain the orientation of the character [69, 374].
* **Heterogeneous Outlines**: Mirror characters like 'p/q' or 'b/d' are drawn with completely unique path lines, not just flipped geometries [69, 276, 374].

---

## 6. INTERACCIÓN Y ENFOQUE DE ATENCIÓN (WCAG 2.2 AAA)
To minimize cognitive overwhelm and accidental activations, respect these standards:

1. **Target Size (SC 2.5.8 & 2.5.5)** [476, 574]:
   * All navigation tap targets (page flips, menu buttons) must be at least **`24px x 24px`** for AA compliance [476, 639] and **`44px x 44px`** for AAA compliance [476, 636]. This prevents accidental page flips [477].
2. **Line Focus Mode** (Inspired by Microsoft Edge Immersive Reader) [474, 477, 552]:
   * Implement a mask that darkens the layout, highlighting only a **1, 3, or 5-line window** [474, 477]. This restricts the ciliar tracking field, helping readers with ADHD or cognitive fatigue to stay anchored [474, 477].
3. **Paginación Horizontal Discreta (Anti-Scroll)** [78]:
   * Continuous vertical scrolling forces the extraocular muscles into constant pursuit tracking, accelerating visual strain [78]. Paging horizontally preserves **spatial memory** and lets the eye rest during the fixation period [78]. Always design reading views to split content into distinct CSS columns or horizontal paginated blocks [78].

---

## 7. CÓDIGO DE COMPORTAMIENTO PARA EL AGENTE DE DESARROLLO
Cuando generes o modifiques componentes o CSS utilizando este estándar:
1. **PRESERVE** the contrast ratio (do not "enhance" backgrounds to white or text to pure black) [73, 296, 385].
2. **NEVER** apply `text-align: justify` [294].
3. **NEVER** allow animations or transitions inside the reading container (reduce motion is default) [78, 623].
4. **ALWAYS** provide user configuration controls (font type, size, line spacing, and software brightness slider) [290, 306, 309].
