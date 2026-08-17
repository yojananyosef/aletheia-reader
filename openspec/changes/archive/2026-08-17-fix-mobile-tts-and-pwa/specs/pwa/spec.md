## Purpose

La Progressive Web App permite instalar Alethia Reader en la pantalla de inicio, funcionar con assets en cache offline, y proporcionar una experiencia de app nativa sin distribución por tiendas.

## ADDED Requirements

### Requirement: Web App Manifest

La aplicación SHALL servir un Web App Manifest válido que cumpla con los criterios de instalabilidad de Chrome y Safari.

#### Scenario: Manifest accesible

WHEN un navegador solicita /manifest.webmanifest
THEN se返回 un JSON válido con name, short_name, start_url, display: standalone, theme_color, background_color, y icons de 192px y 512px

#### Scenario: iOS Apple-specific fields

WHEN el manifest se carga en Safari iOS
THEN incluye apple-touch-icon y apple-mobile-web-app-capable para soporte de instalación

### Requirement: Service Worker

La aplicación SHALL registrar un service worker que implemente caching de assets estáticos (CSS, JS, fonts, imágenes JSON) para funcionamiento offline.

#### Scenario: Assets se cachean tras primera carga

WHEN el usuario carga la app por primera vez
THEN el service worker cachea los assets principales (HTML, CSS, JS, JSON de la biblia)

#### Scenario: Offline funcionalidad

WHEN el usuario abre la app sin conexión a internet
THEN la app carga desde cache y muestra el último capítulo leído

### Requirement: Install Prompt

La aplicación SHALL detectar el evento beforeinstallprompt y ofrecer instalación al usuario en un momento apropiado.

#### Scenario: Banner de instalación

WHEN el navegador dispara beforeinstallprompt Y el usuario no ha instalado la app
THEN se muestra un botón o banner discreto para instalar

#### Scenario: iOS manual install

WHEN el usuario está en Safari iOS
THEN se muestra una instrucción de cómo usar "Agregar a pantalla de inicio" desde el botón de compartir
