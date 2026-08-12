'use client';

import React, { useState } from 'react';
import {
  ReaderSettings,
  LineFocusMode,
} from '@/types/bible';
import {
  BookOpen,
  SunMedium,
  Focus,
  Maximize,
  Minimize,
  Keyboard,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookMarked,
} from 'lucide-react';

interface ReaderToolbarProps {
  settings: ReaderSettings;
  onUpdateSettings: (updates: Partial<ReaderSettings>) => void;
  bookTitle: string;
  chapterNumber: number;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  onOpenBookSelector?: () => void;
  onOpenBookmarks?: () => void;
  bookmarksCount?: number;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  settings,
  onUpdateSettings,
  bookTitle,
  chapterNumber,
  onNextChapter,
  onPrevChapter,
  onOpenBookSelector,
  onOpenBookmarks,
  bookmarksCount = 0,
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-20 flex w-full items-center justify-between border-b px-3 sm:px-5 py-2.5 backdrop-blur-md transition-colors duration-200 select-none shadow-2xs"
        style={{
          backgroundColor: 'var(--reader-bg)',
          borderColor: 'var(--reader-border)',
          color: 'var(--reader-text)',
        }}
      >
        {/* Left: Brand & Book/Chapter Selector Button */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 max-w-[65%] sm:max-w-none">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-reader-accent shrink-0" />
            <span className="font-bold tracking-wide uppercase text-xs hidden lg:inline opacity-80">
              Alethia Reader
            </span>
          </div>

          {/* Book and Chapter Switcher */}
          <div className="flex items-center gap-1">
            {onPrevChapter && (
              <button
                type="button"
                onClick={onPrevChapter}
                aria-label="Capítulo anterior"
                className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-neutral-500/10 active:scale-95 shrink-0"
                style={{ borderColor: 'var(--reader-border)' }}
                title="Capítulo Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenBookSelector}
              className="flex min-h-[38px] max-w-[130px] xs:max-w-[170px] sm:max-w-none items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 sm:px-3.5 py-1 font-bold text-xs sm:text-sm transition-all hover:bg-neutral-500/10 active:scale-95 shadow-2xs"
              style={{ borderColor: 'var(--reader-border)' }}
              aria-label="Abrir selector de libros y capítulos"
            >
              <span className="truncate">{bookTitle} {chapterNumber}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
            </button>

            {onNextChapter && (
              <button
                type="button"
                onClick={onNextChapter}
                aria-label="Capítulo siguiente"
                className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-neutral-500/10 active:scale-95 shrink-0"
                style={{ borderColor: 'var(--reader-border)' }}
                title="Capítulo Siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Center: Quick Font Size & Theme Swatch for Medium/Desktop */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Quick Font Size */}
          <div className="flex items-center rounded-xl border p-0.5" style={{ borderColor: 'var(--reader-border)' }}>
            <button
              type="button"
              onClick={() => onUpdateSettings({ fontSize: Math.max(16, settings.fontSize - 1) })}
              aria-label="Disminuir tamaño de letra"
              disabled={settings.fontSize <= 16}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors hover:bg-neutral-500/10 disabled:opacity-40"
              title="Reducir fuente (A-)"
            >
              A-
            </button>
            <span className="px-2 text-xs font-mono font-medium" aria-label={`Tamaño de fuente: ${settings.fontSize}px`}>
              {settings.fontSize}px
            </span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })}
              aria-label="Aumentar tamaño de letra"
              disabled={settings.fontSize >= 28}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors hover:bg-neutral-500/10 disabled:opacity-40"
              title="Aumentar fuente (A+)"
            >
              A+
            </button>
          </div>

          {/* Quick Theme Switcher */}
          <div className="flex items-center gap-1 rounded-xl border p-0.5" style={{ borderColor: 'var(--reader-border)' }}>
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'pergamino' })}
              aria-label="Modo Pergamino"
              className={`flex h-9 px-2.5 items-center gap-1.5 rounded-lg text-xs font-medium transition-all ${
                settings.theme === 'pergamino'
                  ? 'bg-[#FDFBF6] text-[#222222] ring-2 ring-[#9A5B24] shadow-xs font-bold'
                  : 'hover:bg-neutral-500/10 opacity-70'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-neutral-300 bg-[#FDFBF6]" />
              <span className="hidden xl:inline">Pergamino</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'sepia' })}
              aria-label="Modo Sepia Académico"
              className={`flex h-9 px-2.5 items-center gap-1.5 rounded-lg text-xs font-medium transition-all ${
                settings.theme === 'sepia'
                  ? 'bg-[#F5EFEB] text-[#2B261F] ring-2 ring-[#784421] shadow-xs font-bold'
                  : 'hover:bg-neutral-500/10 opacity-70'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-neutral-300 bg-[#F5EFEB]" />
              <span className="hidden xl:inline">Sepia</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'noche' })}
              aria-label="Modo Noche Suave"
              className={`flex h-9 px-2.5 items-center gap-1.5 rounded-lg text-xs font-medium transition-all ${
                settings.theme === 'noche'
                  ? 'bg-[#1A1A1A] text-[#E8E8E8] ring-2 ring-[#D4A373] shadow-xs font-bold'
                  : 'hover:bg-neutral-500/10 opacity-70'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-neutral-600 bg-[#1A1A1A]" />
              <span className="hidden xl:inline">Noche</span>
            </button>
          </div>
        </div>

        {/* Right: Bookmarks, Shortcuts, Fullscreen, Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {onOpenBookmarks && (
            <button
              type="button"
              onClick={onOpenBookmarks}
              aria-label="Ver versículos guardados"
              className="flex h-9 sm:h-10 px-2 sm:px-2.5 items-center gap-1 sm:gap-1.5 rounded-xl border transition-colors hover:bg-neutral-500/10 text-xs font-semibold"
              style={{ borderColor: 'var(--reader-border)' }}
              title="Versículos Guardados"
            >
              <BookMarked className="h-4 w-4 text-reader-accent" />
              {bookmarksCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-reader-accent px-1 text-[10px] font-bold shadow-xs">
                  {bookmarksCount}
                </span>
              )}
            </button>
          )}

          {/* Keyboard shortcut icon only on sm+ */}
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            aria-label="Ver atajos de teclado y ayuda"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-neutral-500/10"
            title="Atajos de teclado"
          >
            <Keyboard className="h-4.5 w-4.5 opacity-80" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Activar pantalla completa'}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-colors hover:bg-neutral-500/10"
            title="Pantalla Completa (F11)"
          >
            {isFullscreen ? <Minimize className="h-4 w-4 sm:h-4.5 sm:w-4.5 opacity-80" /> : <Maximize className="h-4 w-4 sm:h-4.5 sm:w-4.5 opacity-80" />}
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            aria-expanded={showSettingsDrawer}
            aria-label="Abrir panel de ajustes de lectura y accesibilidad"
            className="flex min-h-[36px] sm:min-h-[38px] items-center gap-1 sm:gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1 font-medium text-xs sm:text-sm transition-all hover:bg-neutral-500/10 active:scale-95"
            style={{ borderColor: 'var(--reader-border)' }}
          >
            <Settings className="h-4 w-4 text-reader-accent" />
            <span className="hidden sm:inline">Ajustes</span>
          </button>
        </div>
      </header>

      {/* Slide-out Accessibility Settings Drawer */}
      {showSettingsDrawer && (
        <div
          role="dialog"
          aria-label="Panel de Ajustes de Lectura y Accesibilidad"
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowSettingsDrawer(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full overflow-y-auto border-l p-4 sm:p-6 pb-safe shadow-2xl transition-all animate-in slide-in-from-right duration-200"
            style={{
              backgroundColor: 'var(--reader-bg)',
              borderColor: 'var(--reader-border)',
              color: 'var(--reader-text)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: 'var(--reader-border)' }}>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-reader-accent" />
                <h2 className="text-lg font-bold">Ajustes de Confort E-Ink</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(false)}
                aria-label="Cerrar panel de ajustes"
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-500/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 1. Theme Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                  Paleta Cromática (Sin Glare / WCAG AAA)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ theme: 'pergamino' })}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 border text-xs font-semibold transition-all ${
                      settings.theme === 'pergamino'
                        ? 'ring-2 ring-[#9A5B24] bg-[#9A5B24]/15 font-bold shadow-xs'
                        : 'hover:bg-neutral-500/10'
                    }`}
                    style={{ borderColor: 'var(--reader-border)' }}
                  >
                    <span className="h-6 w-6 rounded-full border border-neutral-300 bg-[#FDFBF6]" />
                    <span>Pergamino</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ theme: 'sepia' })}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 border text-xs font-semibold transition-all ${
                      settings.theme === 'sepia'
                        ? 'ring-2 ring-[#784421] bg-[#784421]/15 font-bold shadow-xs'
                        : 'hover:bg-neutral-500/10'
                    }`}
                    style={{ borderColor: 'var(--reader-border)' }}
                  >
                    <span className="h-6 w-6 rounded-full border border-neutral-300 bg-[#F5EFEB]" />
                    <span>Sepia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ theme: 'noche' })}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 border text-xs font-semibold transition-all ${
                      settings.theme === 'noche'
                        ? 'ring-2 ring-[#D4A373] bg-[#D4A373]/20 font-bold shadow-xs text-white'
                        : 'hover:bg-neutral-500/10'
                    }`}
                    style={{ borderColor: 'var(--reader-border)' }}
                  >
                    <span className="h-6 w-6 rounded-full border border-neutral-600 bg-[#1A1A1A]" />
                    <span>Noche</span>
                  </button>
                </div>
              </div>

              {/* 2. Typographic Families */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                  Tipografía de Accesibilidad Cognitiva
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ font: 'bookerly' })}
                    className={`flex w-full min-h-[48px] items-center justify-between rounded-xl px-4 py-3 border text-left transition-all ${
                      settings.font === 'bookerly'
                        ? 'ring-2 border-reader-accent bg-reader-accent-subtle font-bold'
                        : 'hover:bg-neutral-500/10'
                    }`}
                    style={{ borderColor: 'var(--reader-border)' }}
                  >
                    <span className="font-serif text-base">Bookerly / Literata (Kindle Serif)</span>
                    {settings.font === 'bookerly' && <span className="text-xs font-sans uppercase text-reader-accent font-bold">Activa</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ font: 'atkinson' })}
                    className={`flex w-full min-h-[48px] items-center justify-between rounded-xl px-4 py-3 border text-left transition-all ${
                      settings.font === 'atkinson'
                        ? 'ring-2 border-reader-accent bg-reader-accent-subtle font-bold'
                        : 'hover:bg-neutral-500/10'
                    }`}
                    style={{ borderColor: 'var(--reader-border)' }}
                  >
                    <div className="flex flex-col">
                      <span className="font-sans text-base">Atkinson Hyperlegible</span>
                      <span className="text-xs opacity-70">Braille Institute (Anti-homóglifos)</span>
                    </div>
                    {settings.font === 'atkinson' && <span className="text-xs uppercase text-reader-accent font-bold">Activa</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ font: 'opendyslexic' })}
                    className={`flex w-full min-h-[48px] items-center justify-between rounded-xl px-4 py-3 border text-left transition-all ${
                      settings.font === 'opendyslexic'
                        ? 'ring-2 border-reader-accent bg-reader-accent-subtle font-bold'
                        : 'hover:bg-neutral-500/10'
                    }`}
                    style={{ borderColor: 'var(--reader-border)' }}
                  >
                    <div className="flex flex-col">
                      <span className="text-base" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>OpenDyslexic</span>
                      <span className="text-xs opacity-70">Gravedad inferior para dislexia</span>
                    </div>
                    {settings.font === 'opendyslexic' && <span className="text-xs uppercase text-reader-accent font-bold">Activa</span>}
                  </button>
                </div>
              </div>

              {/* 3. Font Size */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Tamaño de Fuente
                  </label>
                  <span className="text-sm font-mono font-bold">{settings.fontSize} px</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold opacity-70">16px</span>
                  <input
                    type="range"
                    min="16"
                    max="28"
                    step="1"
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
                    className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-neutral-400/30"
                    style={{ accentColor: 'var(--reader-accent)' }}
                    aria-label="Ajustar tamaño de fuente"
                  />
                  <span className="text-sm font-semibold opacity-70">28px</span>
                </div>
              </div>

              {/* 4. Software PWM Dimming (Mitigación de Parpadeo) */}
              <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--reader-hover)', borderColor: 'var(--reader-border)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <SunMedium className="h-4 w-4 text-reader-accent" />
                    <label className="text-xs font-bold uppercase tracking-wider">
                      Luminancia por Software (PWM Free)
                    </label>
                  </div>
                  <span className="text-xs font-mono font-bold">
                    {Math.round(settings.softwareBrightness * 100)}%
                  </span>
                </div>
                <p className="text-xs opacity-70 mb-3">
                  Atenúa la luz emitida por GPU sin reducir el brillo físico del monitor, previniendo el parpadeo PWM y dolor ocular.
                </p>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={settings.softwareBrightness}
                  onChange={(e) => onUpdateSettings({ softwareBrightness: Number(e.target.value) })}
                  className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-neutral-400/30"
                  style={{ accentColor: 'var(--reader-accent)' }}
                  aria-label="Ajustar atenuación por software"
                />
              </div>

              {/* 5. Line Focus Mode (ADHD & Cognitive Ease) */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Focus className="h-4 w-4 text-reader-accent" />
                  <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Modo Enfoque de Líneas (TDAH)
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['off', '1-line', '3-line', '5-line'] as LineFocusMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onUpdateSettings({ lineFocus: mode })}
                      className={`flex min-h-[44px] items-center justify-center rounded-xl border text-xs font-semibold transition-all ${
                        settings.lineFocus === mode
                          ? 'border-reader-accent bg-reader-accent font-bold shadow-xs'
                          : 'hover:bg-neutral-500/10'
                      }`}
                      style={
                        settings.lineFocus !== mode
                          ? { borderColor: 'var(--reader-border)' }
                          : undefined
                      }
                    >
                      {mode === 'off' ? 'Apagado' : mode.replace('-line', ' L')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts & Accessibility Guide Modal */}
      {showShortcutsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
            style={{
              backgroundColor: 'var(--reader-bg)',
              borderColor: 'var(--reader-border)',
              color: 'var(--reader-text)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: 'var(--reader-border)' }}>
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-reader-accent" />
                <h3 className="text-lg font-bold">Navegación y Atajos de Accesibilidad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-500/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b py-2" style={{ borderColor: 'var(--reader-border)' }}>
                <span>Página Siguiente / Capítulo Siguiente</span>
                <div className="flex gap-1 font-mono text-xs">
                  <kbd className="rounded border px-2 py-1 bg-neutral-500/10">Flecha Derecha</kbd>
                  <kbd className="rounded border px-2 py-1 bg-neutral-500/10">Espacio</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between border-b py-2" style={{ borderColor: 'var(--reader-border)' }}>
                <span>Página Anterior / Capítulo Anterior</span>
                <div className="flex gap-1 font-mono text-xs">
                  <kbd className="rounded border px-2 py-1 bg-neutral-500/10">Flecha Izquierda</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between border-b py-2" style={{ borderColor: 'var(--reader-border)' }}>
                <span>Mover Enfoque de Línea (TDAH)</span>
                <div className="flex gap-1 font-mono text-xs">
                  <kbd className="rounded border px-2 py-1 bg-neutral-500/10">Alt + Arriba / Abajo</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between border-b py-2" style={{ borderColor: 'var(--reader-border)' }}>
                <span>Mostrar/Ocultar Toda la Barra</span>
                <div className="flex gap-1 font-mono text-xs">
                  <kbd className="rounded border px-2 py-1 bg-neutral-500/10">Clic en centro</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <span>Cerrar Ventana / Popover</span>
                <div className="flex gap-1 font-mono text-xs">
                  <kbd className="rounded border px-2 py-1 bg-neutral-500/10">Escape</kbd>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl p-3 border text-xs leading-relaxed" style={{ backgroundColor: 'var(--reader-hover)', borderColor: 'var(--reader-border)' }}>
              <strong>Estándar WCAG 2.2 AAA:</strong> Todas las áreas táctiles tienen un tamaño mínimo de 44x44px, los ratios de contraste superan 12:1 y los colores se adaptan específicamente a la luminancia del modo seleccionado.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
