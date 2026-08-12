# .cursorrules / eink-tailwind-shadcn-rules.md
# Instrucciones de Accesibilidad Biomecánica y Emulación E-Ink para Shadcn/ui y Tailwind CSS

Este documento actúa como una guía de diseño y desarrollo técnica y estricta para el Agente de IA. Prohíbe explícitamente el uso de hojas de estilo CSS legadas, clases monolíticas o etiquetas HTML tradicionales. Toda la filosofía de legibilidad neurocognitiva (modelo 3NPK), emulación de tinta electrónica y accesibilidad (WCAG 2.2 AAA) debe implementarse dinámicamente utilizando el ecosistema de **Tailwind CSS** y componentes de **Shadcn/ui** (basados en Radix UI).

---

## 🚨 REGLAS DURAS PARA EL AGENTE (Prohibiciones)
1. **PROHIBIDO** crear archivos `.css` adicionales o añadir selectores CSS globales heredados (ej. `.lectura-lienzo-emulado`).
2. **PROHIBIDO** el uso de colores blanco puro (`#FFFFFF`) y negro puro (`#000000`) en la interfaz de lectura.
3. **PROHIBIDO** el uso de `text-align: justify` o la clase `text-justify`. Todo el cuerpo de lectura debe ser alineado a la izquierda (`text-left`).
4. **PROHIBIDO** el scroll vertical continuo para lectura inmersiva. El agente debe de manera obligatoria estructurar la navegación mediante paginación horizontal discreta.
5. **PROHIBIDO** diseñar componentes interactivos (botones, selectores, controles de página) con áreas táctiles menores a `24px` (Nivel AA) o `44px` (Nivel AAA).

---

## 🛠️ CONFIGURACIÓN DE ENTORNO (Tailwind Config)

El agente debe asumir o sugerir la extensión de `tailwind.config.js` para integrar la colorimetría de absorción espectral y tipografías accesibles:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        eink: {
          paper: {
            light: '#FDFBF6',   // Crema pergamino (Modo Claro)
            sepia: '#F5EFEB',   // Sepia cálido desaturado
            dark: '#1A1A1A',    // Modo Noche suave (No negro puro)
          },
          ink: {
            light: '#222222',   // Gris carbón (Evita deslumbramiento)
            dark: '#E8E8E8',    // Texto claro para modo noche
          }
        }
      },
      fontFamily: {
        bookerly: ['Bookerly', 'Georgia', 'serif'],
        atkinson: ['Atkinson Hyperlegible', 'sans-serif'],
        dyslexic: ['OpenDyslexic', 'sans-serif'],
      }
    }
  }
}
```

---

## 📐 TRADUCCIÓN FILOSÓFICA A COMPONENTES SHADCN + TAILWIND

### 1. El Lienzo de Lectura (Luminancia y Dispersión de Luz)
*   **Colorimetría**: El contenedor de lectura debe usar clases semánticas dinámicas en base al tema seleccionado:
    *   *Modo Claro*: `bg-eink-paper-light text-eink-ink-light`
    *   *Modo Sepia*: `bg-eink-paper-sepia text-eink-ink-light`
    *   *Modo Noche*: `bg-eink-paper-dark text-eink-ink-dark`
*   **Grano de Papel Procedural**: En lugar de imágenes pesadas, aplica la textura de grano de papel en Tailwind utilizando un pseudo-elemento con una máscara SVG inline en modo de fusión:
    *   Añadir al contenedor de lectura la clase: `relative before:pointer-events-none before:absolute before:inset-0 before:opacity-[0.06] before:mix-blend-multiply before:bg-[url('data:image/svg+xml,%3Csvg_viewBox=%220_0_200_200%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22n%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.8%22_numOctaves=%223%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23n)%22/%3E%3C/svg%3E')]`
    *   En modo noche, la clase de mezcla del pseudo-elemento debe alternar a `before:mix-blend-screen`.

### 2. Ergonomía de Maquetación y Control Sacádico (Modelo 3NPK)
*   **Ancho Máximo**: El contenedor del bloque de texto bíblico o literario debe limitarse estrictamente utilizando `max-w-[60ch]` (óptimo de 50 a 60 caracteres por línea) para prevenir saltos de retorno horizontales ineficientes del ojo.
*   **Interlineado y Alineación**: Aplica siempre `text-left leading-relaxed` o un interlineado dinámico de `leading-[1.6]`. Jamás utilices justificado.
*   **Estructura del Versículo**: Los números de versículo deben maquetarse inline como superíndices pequeños (`vertical-align: super`), reduciendo su contraste mediante `text-xs opacity-50 select-none mr-1` para no romper la continuidad visual Gestalt de la frase.

### 3. Mitigación de PWM por Software (Shadcn Slider)
*   Para evitar el parpadeo de hardware (PWM) a bajo brillo de pantalla, el agente debe implementar un atenuador de brillo por software mediante el componente `<Slider />` de Shadcn:
    *   Instruir al usuario a mantener el brillo físico de su dispositivo al 100%.
    *   El `<Slider />` de Shadcn controlará una variable de estado de React (`brightness`) entre `10` y `100`.
    *   Aplica este valor dinámicamente como un filtro en el estilo en línea del contenedor principal:
        `style={{ filter: `brightness(${brightness}%)` }}`
        Este proceso se ejecuta en la GPU de manera libre de parpadeo.

### 4. Objetivos Táctiles Seguros (Shadcn Button y Cambios de Página)
*   Para prevenir clicks accidentales durante la lectura fluida (WCAG 2.2 SC 2.5.8 / 2.5.5):
    *   Las flechas de paso de página o paginación horizontal deben utilizar el componente `<Button>` de Shadcn estilizado con Tailwind para garantizar un área táctil mínima de `h-11 w-11` (44x44px para cumplimiento AAA).
    *   El foco de selección por teclado de Radix/Shadcn debe ser altamente contrastado y visible utilizando: `focus-visible:ring-2 focus-visible:ring-eink-ink-light focus-visible:ring-offset-2`.

### 5. Line Focus / Enfoque de Líneas para TDAH (Shadcn Switch y Select)
*   Implementa un modo "Enfoque de Línea" (1, 3 o 5 líneas) interactivo utilizando un control de tipo `<Switch />` o `<Select />` de Shadcn:
    *   Al activarse, el componente de lectura añade capas de máscara superior e inferior no interactivas (`pointer-events-none`) con un fondo oscuro translúcido (`bg-black/60` o `bg-eink-paper-dark/80`).
    *   La zona central expone únicamente la altura correspondiente a 1, 3 o 5 líneas basándose en el tamaño de fuente activo (ej. `h-[calc(var(--font-size)*1.6*N)]`), aislando la línea de lectura actual del crowding visual periférico.

---

## 📖 EJEMPLO DE FLUJO DE IMPLEMENTACIÓN PARA EL AGENTE

Cuando le pidas al agente: *"Crea el componente de lectura bíblica"*, el agente debe estructurar la lógica utilizando este árbol mental:

```tsx
import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
// ... imports de Shadcn

export default function ComfortBibleReader() {
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light')
  const [brightness, setBrightness] = useState<number>(100)
  const [fontSize, setFontSize] = useState<number>(16)
  const [lineFocus, setLineFocus] = useState<boolean>(false)

  // 1. Resolver clases de color del tema
  const themeClasses = {
    light: "bg-eink-paper-light text-eink-ink-light before:mix-blend-multiply",
    sepia: "bg-eink-paper-sepia text-eink-ink-light before:mix-blend-multiply",
    dark: "bg-eink-paper-dark text-eink-ink-dark before:mix-blend-screen"
  }

  return (
    <div 
      className={`min-h-screen transition-colors duration-150 relative ${themeClasses[theme]}`}
      style={{ filter: `brightness(${brightness}%)` }} // PWM Mitigation
    >
      {/* 2. Barra de herramientas flotante con componentes Shadcn */}
      <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
        {/* Controles de tipografía, Slider de brillo, Switch de Line Focus */}
      </header>

      {/* 3. Lienzo de lectura con ancho limitado, sin justificar y grano procedural SVG */}
      <main className="max-w-[60ch] mx-auto px-6 py-12 text-left select-text relative">
        <article className="prose dark:prose-invert">
          {/* El texto continuo fluye aquí. Los versículos usan superíndice inline */}
        </article>
      </main>
    </div>
  )
}
```

El agente debe usar este archivo de reglas para traducir de manera fluida y moderna cualquier patrón funcional sin comprometer la limpieza de tu arquitectura de Tailwind y Shadcn/ui.
