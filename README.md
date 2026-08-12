# 📖 Alethia Reader

> **Lector Bíblico Modular de Ultraconfort Neurocognitivo, Emulación de Tinta Electrónica y Accesibilidad Universal (WCAG 2.2 AAA)**

![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)
![WCAG](https://img.shields.io/badge/WCAG-2.2_AAA-green?style=flat-square)
![Bun](https://img.shields.io/badge/Bun-1.3-black?style=flat-square&logo=bun)

---

## 🌟 Visión General

**Alethia Reader** es una aplicación web y componente de lectura interactivo diseñado para transformar la lectura digital en pantallas emisivas (LCD, OLED, IPS) en una experiencia pasiva, serena y biestética, emulando la física del papel y de los paneles de tinta electrónica (**E-Ink / Kindle**).

Basado en el **modelo neurocognitivo 3NPK** y el cumplimiento estricto del estándar **WCAG 2.2 AAA**, Alethia Reader combate la **astenopia visual** (fatiga ocular por emisión directa de luz azul y parpadeo PWM) y elimina barreras cognitivas para lectores con **dislexia, TDAH, baja visión y fatiga crónica**.

Incorpora el canon completo de los **66 libros de la Biblia** en español con perícopas estructuradas, versículos indexados, notas al pie exegéticas y un sistema fluido de marcadores.

---

## 🔬 Fundamentos y los 7 Pilares de Confort

Alethia Reader no es un lector web convencional con modo oscuro; implementa una arquitectura basada en siete pilares de ingeniería biomédica y diseño visual:

```
                  ┌─────────────────────────────────────────┐
                  │          ALETHIA DESIGN SYSTEM          │
                  └────────────────────┬────────────────────┘
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        │              │               │               │              │
 ┌──────┴──────┐┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐┌──────┴──────┐
 │ Colorimetría││ Grano Papel │ │ Ergonomía   │ │ Paginación  ││ Tipografías │
 │ 12:1 - 15:1 ││  SVG Noise  │ │  50-60 CPL  │ │  Discreta   ││ Accesibles  │
 └─────────────┘└─────────────┘ └─────────────┘ └─────────────┘└─────────────┘
        │                                                     │
 ┌──────┴───────────────────────────┐         ┌───────────────┴──────────────┐
 │   Atenuación PWM por GPU         │         │ Enfoque Line Focus (TDAH)    │
 │ (Hardware al 100%, Shader oscuro)│         │ (Áreas táctiles AAA >= 44px) │
 └──────────────────────────────────┘         └──────────────────────────────┘
```

### 1. Paleta Cromática y Luminancia Equilibrada (12:1 a 15:1)
* **Prohibición de extremos:** Se elimina el uso de blanco puro (`#FFFFFF`) y negro puro (`#000000`) para evitar deslumbramiento (*ocular glare*) y el efecto de halo (*halation*).
* **3 Modos Cromáticos:**
  * **Modo Pergamino (Por defecto):** Fondo crema cálido (`#FDFBF6`) con texto gris carbón (`#222222`). Absorbe longitudes de onda corta (luz azul de 415–455 nm) protegiendo el ciclo circadiano.
  * **Modo Sepia Académico:** Lienzo cálido desaturado (`#F5EFEB`) con tipografía nogal profundo (`#2B261F`).
  * **Modo Noche Suave:** Fondo negro mate profundo (`#1A1A1A`) con tipografía blanco cálido desaturado (`#E8E8E8`).

### 2. Texturizado Procedimental por Software (SVG Fractal Noise)
* Capa no interactiva (`pointer-events: none`) con filtro procedural SVG `feTurbulence` (frecuencia base 0.8, 3 octavas).
* Aplica `mix-blend-mode: multiply` en modos claros y `mix-blend-screen` en modo noche, dispersando la luz y rompiendo la uniformidad rígida de los píxeles digitales.

### 3. Ergonomía de Maquetación y Control Sacádico
* **Límite de 50 a 60 Caracteres por Línea (CPL):** Contenedor estricto `max-w-[60ch]` para optimizar los saltos sacádicos del ojo y prevenir pérdidas de línea en el retorno.
* **Alineación a la Izquierda Obligatoria (`text-left`):** Prohibido el texto justificado para erradicar los "ríos de blanco" que inducen confusión visual en lectores con dislexia.
* **Interlineado Generoso:** `line-height: 1.6em` para evitar solapamientos entre trazos ascendentes y descendentes.
* **Superíndice Ergonómico:** Números de versículos inline atenuados (`opacity: 0.55`) para mantener la continuidad perceptual Gestalt de cada frase.

### 4. Cinemática de Paginación Horizontal Discreta (Anti-Scroll)
* Se suprime el desplazamiento vertical continuo (*infinite scroll*), el cual fatiga los músculos oculares por seguimiento continuo (*smooth pursuit tracking*).
* Cálculo dinámico de páginas discretas que preservan la **memoria espacial** del lector. Transiciones instantáneas con soporte para teclado, toques laterales Kindle y gestos *swipe* en dispositivos móviles.

### 5. Ecosistema Tipográfico Neurocognitivo
El lector permite alternar dinámicamente entre tres tipografías especializadas:
* **Bookerly / Literata (Kindle Serif):** Diseñada para lectura prolongada con contrapunzadas (*counters*) abiertas y serifs asimétricos que anclan el glifo a la cuadrícula de píxeles.
* **Atkinson Hyperlegible (Braille Institute):** Diseñada para baja visión y distinción radical de pares críticos y homóglifos (**I / l / 1**, **O / 0**, **B / 8**, **p / q**).
* **OpenDyslexic:** Tipografía especializada con bases ponderadas por gravedad visual que evitan la rotación o inversión mental de letras.

### 6. Mitigación de Parpadeo PWM (Flicker-Free GPU Dimming)
* Para evitar que la pantalla active la modulación por ancho de pulsos (PWM) al bajar el brillo físico, el sistema instruye al usuario a mantener el monitor al 100% y ejecuta la atenuación lumínica mediante un filtro GPU por software (slider de 30% a 100%).

### 7. Accesibilidad Cognitiva y Modo Line Focus (WCAG 2.2 AAA)
* **Line Focus (Microsoft Edge Style):** Máscara de sombreado que aísla selectivamente **1, 3 o 5 líneas**, eliminando el ruido periférico para personas con TDAH o fatiga severa.
* **Objetivos Táctiles AAA:** Todos los botones y controles interactivos superan el tamaño mínimo de **$44\times 44\text{px}$** (`min-h-[44px]`), con foco por teclado visible (`focus-visible`).

---

## 📱 Características de la Aplicación

* 📚 **Explorador Bíblico Completo:** Navegación por los 66 libros del Antiguo y Nuevo Testamento con buscador en tiempo real y selector directo de capítulos.
* 🔎 **Modal de Estudio y Versículos:** Clic en cualquier versículo para abrir su ficha, copiar la cita al portapapeles y consultar notas exegéticas o históricas.
* 🔖 **Sistema de Marcadores:** Guarda y gestiona versículos favoritos con acceso rápido desde un panel lateral.
* ⌨️ **Atajos de Teclado Universales:**
  * `Flecha Derecha` / `Espacio`: Página siguiente / Capítulo siguiente.
  * `Flecha Izquierda` / `Shift + Espacio`: Página anterior / Capítulo anterior.
  * `Alt + Flecha Arriba / Abajo`: Desplazar la ventana activa de *Line Focus*.
  * `Clic central`: Ocultar / mostrar barra de herramientas (Modo Inmersivo).
  * `Escape`: Cerrar modales y paneles.
* 📐 **Diseño Totalmente Responsivo:** Adaptado a pantallas móviles, tablets, laptops y monitores ultrawide.

---

## 📂 Estructura del Proyecto

```
alethia-reader/
├── app/
│   ├── globals.css           # Tokens del sistema de diseño, fuentes y clases E-Ink
│   ├── layout.tsx            # Metadata, Viewport y configuración base HTML
│   └── page.tsx              # Orquestador principal, explorador bíblico y marcadores
├── components/
│   └── reader/
│       ├── ComfortBibleReader.tsx # Componente contenedor y gestor de estado
│       ├── ReadingCanvas.tsx      # Lienzo de lectura con paginación horizontal
│       ├── ReaderToolbar.tsx      # Barra de herramientas y panel de ajustes
│       ├── ReaderFooter.tsx       # Progreso de lectura y controles de página
│       ├── LineFocusOverlay.tsx   # Máscara de enfoque de 1, 3 o 5 líneas
│       ├── PaperGrainOverlay.tsx  # Capa de grano de papel procedimental SVG
│       ├── PwmDimmerOverlay.tsx   # Atenuador de luminancia GPU (PWM Free)
│       └── VerseModal.tsx         # Modal de versículo, notas al pie y copiado
├── context/
│   ├── docs/                 # Pliegos técnicos, análisis Kindle y evidencia neurocognitiva
│   ├── rules/                # Reglas estrictas de maquetación y accesibilidad
│   ├── styles/               # Especificación CSS original
│   └── components/           # Prototipo base de referencia
├── lib/
│   ├── bible-service.ts      # Cliente de datos bíblicos asíncrono con caché en memoria
│   └── sample-biblical-data.ts# Datos de respaldo / fallback
├── public/
│   └── json/                 # 66 libros de la Biblia en formato JSON + bible.json
└── types/
    └── bible.ts              # Definiciones e interfaces TypeScript estrictas
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* [Bun](https://bun.sh/) (Recomendado) o [Node.js](https://nodejs.org/) (v18+)

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/alethia-reader.git
   cd alethia-reader
   ```

2. **Instalar dependencias:**
   ```bash
   bun install
   # o con npm:
   # npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   bun dev
   # o con npm:
   # npm run dev
   ```

4. **Abrir en el navegador:**
   Ingresa a [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Scripts Disponibles

* `bun dev`: Inicia el servidor de desarrollo de Next.js.
* `bun run build`: Compila la versión de producción optimizada.
* `bun start`: Ejecuta el servidor en modo producción.
* `bun run lint`: Ejecuta el linter ESLint.

---

## ♿ Cumplimiento de Estándares WCAG 2.2 AAA

| Criterio de Éxito WCAG 2.2 | Implementación en Alethia Reader |
|---|---|
| **1.4.3 / 1.4.6 Contraste (AAA)** | Ratios de contraste dinámico calibrados entre **12:1 y 15:1**, superando el mínimo legal de 7:1 sin causar deslumbramiento. |
| **1.4.8 Presentación Visual (AAA)** | Ancho limitado a 60 CPL, interlineado $\ge 1.6$, sin texto justificado y selección de tipografías legibles. |
| **1.4.12 Espaciado del Texto (AA)** | Soporte tipográfico adaptativo para `letter-spacing`, `word-spacing` y `line-height`. |
| **2.1.1 Accesibilidad por Teclado** | Navegación completa sin necesidad de ratón (paginación, ajustes, modales y *Line Focus*). |
| **2.4.13 Apariencia del Foco (AAA)** | Indicadores de foco visual de alto contraste (`focus-visible: outline 3px`) con halo de separación. |
| **2.5.5 / 2.5.8 Tamaño del Objetivo** | Todas las zonas interactivas poseen un área mínima de **$44\times 44\text{px}$** para evitar errores motores. |

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
