### Pliego de Especificaciones Técnicas: Sistema de Emulación de Tinta Electrónica y Accesibilidad Universal

#### 1\. Fundamentos Cromáticos, Luminancia y Contraste Dinámico

La arquitectura cromática de un sistema de lectura digital representa el primer baluarte estratégico contra la astenopia visual (fatiga ocular). Mientras que el hardware Kindle utiliza una iluminación frontal ( *frontlight* ) que rebota difusamente hacia el ojo imitando la reflexión del papel físico, las pantallas emisivas estándar proyectan luz directamente hacia la retina ( *backlight* ), acelerando la fatiga del aparato ciliar. Se exige una gestión estricta de la luminancia para transformar esta emisión activa en una experiencia de visualización pasiva, mitigando el estrés fotosensible mediante la emulación del espectro de reflexión electroforética.

##### Especificación de Paleta de Colores

Queda terminantemente prohibido el uso de contrastes extremos (blanco puro \#FFFFFF / negro puro \#000000). El sistema deberá implementar obligatoriamente los siguientes valores hexadecimales:| Modo de Visualización | Lienzo (Background) | Texto (Foreground) || \------ | \------ | \------ || **Crema / Sepia** | \#FDFBF6 | \#222222 || **Térmico / Papel** | \#F5EFEB | \#1C1C5E || **Gris Carbón** | \#222222 | \#FDFBF6 |

##### Análisis de Ratios de Contraste

Se prescribe el mantenimiento estricto de una proporción de contraste de entre  **12:1 y 15:1** . Este rango técnico garantiza la superación de los criterios de éxito  **WCAG 2.2 AAA**  (mínimo 7:1) sin inducir deslumbramiento retiniano ni fenómenos de halo, preservando la agudeza visual en sesiones de lectura prolongada.

##### Directriz de Atenuación Dinámica

El motor de renderizado deberá ejecutar un filtrado de software que reduzca la estimulación de los fotorreceptores ipRGCs mediante la absorción de longitudes de onda corta ( **luz azul 415–455 nm** ). El objetivo es emular la calidez del papel no blanqueado y proteger los ritmos circadianos del usuario.La pureza cromática lograda constituye el sustrato necesario para romper la uniformidad plana del píxel mediante el texturizado procedimental del lienzo.

#### 2\. Texturizado Procedimental por Software y Mitigación de Reflejo

Para transformar una pantalla emisiva en una superficie de lectura pasiva, es imperativo emular la micro-textura del papel físico. Esta técnica rompe la coherencia del píxel y reduce el reflejo especular, dispersando la luz de manera orgánica para simular un material tangible.

##### Arquitectura del Filtro SVG

Se aplicará un filtro de ruido fractal procedural mediante el estándar SVG con las siguientes propiedades técnicas:

* **Tipo:**  feTurbulence (fractalNoise).  
* **Frecuencia base:**  0.8.  
* **Octavas:**  3.Implementación CSS obligatoria:

.lienzo-papel::before {  
  content: "";  
  position: fixed;  
  top: 0; left: 0;  
  width: 100vw; height: 100vh;  
  pointer-events: none; /\* Optimización de ciclos de GPU \*/  
  opacity: 0.25;  
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");  
  mix-blend-mode: multiply;  
}

##### Simulación de Materiales

Los algoritmos de renderizado deberán implementar variaciones estocásticas en el mapeo de luminancia para emular propiedades de  *roughness*  (rugosidad),  *fiber*  (fibras),  *crumples*  (arrugas) y  *folds*  (pliegues). Estas irregularidades microscópicas aseguran una dispersión lumínica uniforme, evitando que la superficie sea percibida como un cristal plano.

##### Optimización de Carga

Se instruye el uso de capas fijas no interactivas mediante pointer-events: none. Esta configuración asegura que la capa de textura no interfiera con el árbol de eventos del DOM, manteniendo un bajo costo computacional en la GPU durante las transiciones de página.La textura del lienzo define el contenedor físico donde se ejecutarán las reglas deterministas de maquetación de columna.

#### 3\. Ergonomía de Maquetación y Proporciones de Columna

La biomecánica del movimiento sacádico dicta la eficiencia lectora. Una maquetación estricta previene micro-sacadas ineficientes y la fatiga del aparato ciliar, optimizando el tiempo de fijación retiniana.

* **Reglas de Caracteres por Línea (CPL):**  Se establece un estándar de  **50 a 60 CPL** . Queda prohibido superar los 75 caracteres, dado que el incremento de la longitud de línea eleva el riesgo de perder la línea objetivo durante el retorno sacádico.  
* **Dimensionamiento Visual Foveal:**  El tamaño base será de  **16px/1rem**  para garantizar un ángulo visual  $\\ge 0.3^\\circ$ . Se exige el uso de clamp(1rem, 1rem \+ 0.5vw, 1.375rem) para asegurar un escalado dinámico proporcional al dispositivo.  
* **Arquitectura de Espaciado (SC 1.4.12):**  
* **Interlineado:**  Entre  **1.4em y 1.6em** .  
* **Márgenes:**  Del  **10% al 15%**  del ancho de pantalla. Estos canales horizontales actúan como guías para la fijación retiniana, eliminando el hacinamiento visual.La estabilidad de la columna es el requisito biomecánico para una navegación que preserve la integridad de la memoria espacial.

#### 4\. Cinemática de la Página y Navegación Espacial

El desplazamiento vertical continuo ( *scroll* ) fragmenta la atención y destruye la memoria espacial del lector. En su lugar, el sistema debe priorizar la paginación horizontal para facilitar la retención cognitiva de la información.

* **Supresión de Scroll Continuo:**  Se prohíbe explícitamente el desplazamiento fluido. El sistema implementará paneles estáticos que permitan al ojo descansar durante la fijación, reduciendo la carga de seguimiento suave ( *smooth pursuit tracking* ).  
* **Gestión de Memoria Espacial:**  Las transiciones deben ser instantáneas, emulando la biestabilidad del panel E-Ink. La ausencia de animaciones suavizadas refuerza la ubicación del texto en la estructura mental del usuario.  
* **Ubicación Absoluta (Location Indexing):**  Se adoptará un sistema de indexación por bloques de datos invariables (tipo Kindle). La posición de lectura debe permanecer constante independientemente de los cambios en el tamaño de fuente o la configuración de márgenes.La estructura discreta de la página actúa como el soporte físico para el despliegue de tipografías de alta legibilidad.

#### 5\. Tipografías de Accesibilidad y Reconocimiento Gestalt

La ingeniería tipográfica debe priorizar el diseño anatómico para evitar la confusión de homoglifos y maximizar el reconocimiento Gestalt de las palabras en entornos de baja resolución o iluminación.

##### Comparativa de Ingeniería Tipográfica

* **Bookerly:**  Implementa contrapunzadas cuadradas y amplias con serifs asimétricos diseñados para anclar el glifo a la retícula de 300 ppi, evitando el "cierre" de la letra por colisiones de pigmento.  
* **Atkinson Hyperlegible Next (v. 2025):**  Evolución del estándar de legibilidad que introduce pesos variables y un set expandido de caracteres. Maximiza la distinción en pares críticos como  **B/8, O/0, y 1/I/l** , rompiendo la uniformidad estética en favor de la precisión funcional.  
* **OpenDyslexic:**  Utiliza bases ponderadas que funcionan como anclas visuales, evitando la rotación o inversión percibida de caracteres como  **b/d**  y  **p/q** .

##### Configuración del Motor Tipográfico

Se dictan los siguientes comandos para el motor de renderizado:

* Uso obligatorio de  **kerning dinámico**  y  **ligaduras tipográficas**  (fi, fl).  
* Aplicación de  **hinting óptico**  adaptado a densidades de 300 ppi.  
* Soporte para pesos variables en tipografías de nueva generación.El control de la forma tipográfica debe integrarse con la gestión de la salida lumínica del hardware a través de capas de software.

#### 6\. Atenuación de Brillo por Software y Mitigación de PWM

El parpadeo por Modulación de Ancho de Pulso (PWM) es responsable de migrañas y resecamiento ocular. Se exige una estrategia de control que elimine las fluctuaciones de luminancia del hardware.

1. **Estrategia de Control de GPU:**  El brillo del hardware se mantendrá permanentemente al  **100%**  para eliminar el  *flicker* .  
2. **Multiplicador Lineal RGB (Shader de Densidad):**  La reducción de luminosidad se ejecutará mediante un filtro de software que aplique un multiplicador lineal sobre los valores de los píxeles. El shader debe calcular el producto del valor base y una "constante de densidad" para simular la saturación de tinta orgánica, en lugar de un filtro de opacidad simple.  
3. **Beneficio Fisiológico:**  Esta técnica garantiza una emisión lumínica estable que preserva la salud fotosensible del usuario, permitiendo lecturas prolongadas sin inducir fatiga.La estabilidad lumínica resultante es la condición previa para garantizar la precisión necesaria en la interacción táctil avanzada.

#### 7\. Interfaces Táctiles, Enfoque de Atención y Cumplimiento WCAG AAA

La ergonomía táctil y el aislamiento cognitivo deben converger para ofrecer una interfaz que minimice la sobrecarga sensorial y los errores motores.

* **Dimensionamiento de Objetivos (SC 2.5.5 / 2.5.8):**  Los elementos interactivos tendrán un tamaño mínimo de  **44x44px**  (Nivel AAA). Se definirán zonas táctiles invisibles y amplias para la navegación de página.  
* **Sistema Line Focus:**  Funcionalidad obligatoria de aislamiento de  **1, 3 o 5 líneas** , reduciendo el ruido visual para usuarios con dificultades de atención.  
* **Indicadores de Foco (SC 2.4.12 / 2.4.13):**  Se prescriben estilos de foco de alta visibilidad (Focus Appearance AAA) que no sean oscurecidos por elementos superpuestos.  
* **Asistentes Cognitivos:**  Integración de  **Word Wise**  (definiciones dinámicas) y  **X-Ray**  (análisis semántico y de personajes) para apoyo en tiempo real.La integración de estos  **Siete Pilares**  (Fundamentos Cromáticos, Texturizado Procedimental, Ergonomía de Maquetación, Cinemática de Navegación, Ingeniería Tipográfica, Atenuación de Brillo y Accesibilidad Táctil) constituye el estándar de oro en ingeniería de lectura digital, elevando la experiencia del usuario a la máxima expresión de la accesibilidad universal.

