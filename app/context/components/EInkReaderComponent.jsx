import React, { useState, useEffect, useRef } from "react";
import "./eink-design-system.css"; // Importa la hoja de estilos base

/**
 * Componente EInkReaderView
 * 
 * Implementa un contenedor de lectura web interactivo con emulación de tinta electrónica,
 * controles de accesibilidad cognitiva (TDAH/Dislexia), mitigación de PWM y Line Focus (Microsoft Edge style).
 */
export const EInkReaderView = ({ children, initialTitle = "Documento de Lectura" }) => {
  // --- Estados de Configuración de Interfaz ---
  const [theme, setTheme] = useState("light"); // light (Crema) | dark (Noche)
  const [fontFamily, setFontFamily] = useState("serif"); // serif (Bookerly) | sans (Atkinson) | dyslexic (OpenDyslexic)
  const [fontSize, setFontSize] = useState(16); // 14px a 24px
  const [lineHeight, setLineHeight] = useState(1.6); // 1.4 a 2.0
  const [columnMode, setColumnMode] = useState("single"); // single | double (Two-column layout)
  
  // --- Estados Especiales de Accesibilidad ---
  const [softwareBrightness, setSoftwareBrightness] = useState(1.0); // Rango 0.4 a 1.0 (Mitiga PWM)
  const [lineFocusMode, setLineFocusMode] = useState("off"); // off | 1-line | 3-line | 5-line
  const [activeLineIndex, setActiveLineIndex] = useState(0); // Línea activa de enfoque
  
  const contentRef = useRef(null);
  const containerRef = useRef(null);

  // --- Efecto: Sincronizar el brillo por software con variables CSS del documento ---
  useEffect(() => {
    document.documentElement.style.setProperty("--eink-software-brightness", softwareBrightness);
    if (softwareBrightness < 1.0) {
      document.body.classList.add("software-dimmed");
    } else {
      document.body.classList.remove("software-dimmed");
    }
  }, [softwareBrightness]);

  // --- Efecto: Sincronizar clases globales del body ---
  useEffect(() => {
    const bodyClass = document.body.classList;
    bodyClass.add("eink-reader");
    
    if (theme === "dark") {
      bodyClass.add("dark-mode");
    } else {
      bodyClass.remove("dark-mode");
    }

    return () => {
      bodyClass.remove("eink-reader", "dark-mode");
    };
  }, [theme]);

  // --- Funcionalidad: Manejador de Teclado para Line Focus (SC 2.1.1 Keyboard) ---
  useEffect(() => {
    if (lineFocusMode === "off") return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveLineIndex((prev) => prev + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveLineIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lineFocusMode]);

  // --- Cálculos Dinámicos de Coordenadas para Line Focus Overlays ---
  const renderLineFocusOverlays = () => {
    if (lineFocusMode === "off" || !contentRef.current) return null;

    const paragraphs = contentRef.current.querySelectorAll("p");
    if (paragraphs.length === 0) return null;

    // Tomar un párrafo base para simular las líneas. En producción, esto rastrea líneas reales mediante rangos de texto (TextRanges)
    const targetParagraph = paragraphs[Math.min(activeLineIndex, paragraphs.length - 1)];
    if (!targetParagraph) return null;

    const rect = targetParagraph.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calcular altura del canal de lectura activo basado en el número de líneas enfocado
    const lineHeightPx = fontSize * lineHeight;
    let focusHeight = lineHeightPx;
    if (lineFocusMode === "3-line") focusHeight = lineHeightPx * 3;
    if (lineFocusMode === "5-line") focusHeight = lineHeightPx * 5;

    const topOverlayHeight = rect.top + window.scrollY;
    const bottomOverlayTop = topOverlayHeight + focusHeight;
    const bottomOverlayHeight = Math.max(0, document.documentElement.scrollHeight - bottomOverlayTop);

    return (
      <>
        {/* Overlay Superior */}
        <div 
          className="line-focus-overlay" 
          style={{ top: 0, height: `${topOverlayHeight}px` }} 
        />
        {/* Overlay Inferior */}
        <div 
          className="line-focus-overlay" 
          style={{ top: `${bottomOverlayTop}px`, height: `${bottomOverlayHeight}px` }} 
        />
        {/* Indicador de Foco Activo */}
        <div 
          className="line-focus-active-window"
          style={{
            top: `${topOverlayHeight}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${focusHeight}px`
          }}
        />
      </>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`eink-app-wrapper ${theme === "dark" ? "dark-mode" : ""}`}
      style={{
        "--eink-font-size-base": `${fontSize}px`,
        "--eink-line-height": lineHeight,
        fontFamily: 
          fontFamily === "serif" ? "var(--eink-font-serif)" : 
          fontFamily === "dyslexic" ? "var(--eink-font-dyslexic)" : "var(--eink-font-sans)"
      }}
    >
      {/* ==========================================
          BARRA DE HERRAMIENTAS DE ACCESIBILIDAD (Atenuada)
          ========================================== */}
      <header className="eink-toolbar" style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 2rem",
        borderBottom: "1px solid rgba(0,0,0,0.1)",
        fontFamily: "var(--eink-font-sans)"
      }}>
        <div className="title-section">
          <span style={{ fontWeight: 700 }}>{initialTitle}</span>
        </div>

        {/* Panel de Controles Interactivos */}
        <div className="controls-group" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          
          {/* 1. Control de Fuente */}
          <div className="control-item">
            <label htmlFor="font-select" style={{ marginRight: "0.5em", fontSize: "0.85rem" }}>Tipografía:</label>
            <select 
              id="font-select" 
              value={fontFamily} 
              onChange={(e) => setFontFamily(e.target.value)}
              className="eink-button"
              style={{ padding: "0.25rem 0.5rem", minHeight: "36px" }}
            >
              <option value="serif">Bookerly (Serif)</option>
              <option value="sans">Atkinson (Sans)</option>
              <option value="dyslexic">OpenDyslexic</option>
            </select>
          </div>

          {/* 2. Control de Tamaño de Letra (ADHD Settings) */}
          <div className="control-item" style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", marginRight: "0.5em" }}>Tamaño:</span>
            <button className="eink-button" onClick={() => setFontSize(prev => Math.max(14, prev - 1))} style={{ width: "36px", height: "36px", padding: 0 }}>A-</button>
            <span style={{ margin: "0 0.5rem" }}>{fontSize}px</span>
            <button className="eink-button" onClick={() => setFontSize(prev => Math.min(26, prev + 1))} style={{ width: "36px", height: "36px", padding: 0 }}>A+</button>
          </div>

          {/* 3. Control de Brillo por Software (GPU scaling) */}
          <div className="control-item" style={{ display: "flex", alignItems: "center" }}>
            <label htmlFor="brightness-slider" style={{ fontSize: "0.85rem", marginRight: "0.5em" }}>Luminancia (GPU):</label>
            <input 
              id="brightness-slider"
              type="range" 
              min="0.4" 
              max="1.0" 
              step="0.05"
              value={softwareBrightness}
              onChange={(e) => setSoftwareBrightness(parseFloat(e.target.value))}
              style={{ cursor: "pointer" }}
            />
            <span style={{ marginLeft: "0.5em", fontSize: "0.85rem" }}>{Math.round(softwareBrightness * 100)}%</span>
          </div>

          {/* 4. Enfoque de Líneas (Line Focus) */}
          <div className="control-item">
            <label htmlFor="focus-select" style={{ marginRight: "0.5em", fontSize: "0.85rem" }}>Enfoque:</label>
            <select 
              id="focus-select" 
              value={lineFocusMode} 
              onChange={(e) => {
                setLineFocusMode(e.target.value);
                setActiveLineIndex(0);
              }}
              className="eink-button"
              style={{ padding: "0.25rem 0.5rem", minHeight: "36px" }}
            >
              <option value="off">Apagado</option>
              <option value="1-line">1 Línea</option>
              <option value="3-line">3 Líneas</option>
              <option value="5-line">5 Líneas</option>
            </select>
          </div>

          {/* 5. Alternador de Columnas */}
          <button 
            className="eink-button" 
            style={{ padding: "0.25rem 0.75rem", minHeight: "36px" }}
            onClick={() => setColumnMode(prev => prev === "single" ? "double" : "single")}
          >
            {columnMode === "single" ? "Doble Columna" : "Columna Única"}
          </button>

          {/* 6. Tema Sepia/Noche */}
          <button 
            className="eink-button" 
            style={{ padding: "0.25rem 0.75rem", minHeight: "36px" }}
            onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")}
          >
            {theme === "light" ? "Modo Noche" : "Modo Crema"}
          </button>
        </div>
      </header>

      {/* ==========================================
          LIENZO DE LECTURA PRINCIPAL
          ========================================== */}
      <main className="eink-main-flow" style={{ position: "relative" }}>
        
        {/* Renderizado de Overlays de Line Focus */}
        {renderLineFocusOverlays()}

        <article 
          ref={contentRef}
          className={`eink-container ${columnMode === "double" ? "two-columns" : ""}`}
        >
          {children ? children : (
            <>
              <h1>La Física y el Software en la Simulación de Lectura Confortable</h1>
              <p>
                La consecución de una lectura cómoda e inerte en entornos digitales requiere
                reemplazar los contrastes extremos que emiten fotones directamente a la retina.
                El uso de blanco puro (#FFFFFF) y negro puro (#000000) fatiga los músculos ciliares, 
                ya que obliga a la pupila a realizar constantes microajustes acomodativos debido al 
                deslumbramiento.
              </p>
              <p>
                Al adoptar combinaciones cálidas y desaturadas, como la crema pergamino (#FDFBF6) para el 
                fondo y el gris carbón suave (#222222) para la tipografía, se logra una relación de contraste 
                balanceada de entre 12:1 y 15:1. Esta relación supera las exigencias de accesibilidad 
                WCAG 2.2 AAA (7:1 mínimo) sin perturbar los fotorreceptores responsables de la fatiga circadiana.
              </p>
              <p>
                Asimismo, para combatir el crowding visual o hacinamiento, el espaciado de letras (tracking), 
                palabras e interlineado debe incrementarse adaptativamente. De acuerdo con el criterio WCAG 1.4.12, 
                el texto debe permanecer legible cuando el usuario aumenta las separaciones, lo que evita que los 
                grafemas se fundan visualmente en la retina de lectores con dislexia o fatiga ocular severa.
              </p>
              <p>
                Por último, la atenuación por software es fundamental para contrarrestar el parpadeo invisible 
                por modulación de ancho de pulso (PWM) de las pantallas OLED y LCD a bajo brillo. Mantener el 
                hardware de retroiluminación al 100% y oscurecer los colores mediante un multiplicador lineal 
                en la GPU elimina las ondas de refresco estroboscópicas, protegiendo la salud ocular del usuario.
              </p>
            </>
          )}
        </article>
      </main>
    </div>
  );
};
