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
  ChevronDown,
  BookMarked,
  Volume2,
  Check,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';

import { motion, AnimatePresence } from 'framer-motion';

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
  onToggleAudioNarrator?: () => void;
  isAudioNarratorActive?: boolean;
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
  onToggleAudioNarrator,
  isAudioNarratorActive = false,
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
      <AnimatePresence>
        {settings.showToolbar && (
          <motion.header
            role="banner"
            initial={{ opacity: 0, height: 0, y: -30 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -30 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-[var(--reader-border)] bg-[var(--reader-bg)] text-[var(--reader-text)] px-3 sm:px-5 py-2 backdrop-blur-md transition-colors duration-200 select-none shadow-2xs shrink-0 overflow-hidden"
          >
        {/* Left: Brand & Bible Explorer / Books Selector Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-reader-accent shrink-0" />
            <span className="font-bold tracking-wide uppercase text-xs hidden lg:inline opacity-80">
              Alethia Reader
            </span>
          </div>

          {/* Clean 'Libros' Selector Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenBookSelector}
            className="font-bold text-xs sm:text-sm gap-1.5"
            aria-label="Explorar libros y capítulos de la Biblia"
            title="Explorar libros y capítulos"
          >
            <Search className="h-3.5 w-3.5 opacity-70" />
            <span>Libros</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </div>

        {/* Center: Quick Font Size & Theme Swatch for Medium/Desktop */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Quick Font Size */}
          <div className="flex items-center rounded-xl border border-[var(--reader-border)] p-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onUpdateSettings({ fontSize: Math.max(16, settings.fontSize - 1) })}
              disabled={settings.fontSize <= 16}
              aria-label="Disminuir tamaño de letra"
              title="Reducir fuente (A-)"
            >
              A-
            </Button>
            <span className="px-2 text-xs font-mono font-medium">
              {settings.fontSize}px
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onUpdateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })}
              disabled={settings.fontSize >= 28}
              aria-label="Aumentar tamaño de letra"
              title="Aumentar fuente (A+)"
            >
              A+
            </Button>
          </div>

          {/* Quick Theme Switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-[var(--reader-border)] p-0.5">
            <Button
              variant={settings.theme === 'pergamino' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onUpdateSettings({ theme: 'pergamino' })}
              aria-label="Modo Pergamino"
              className={settings.theme === 'pergamino' ? 'bg-[#FDFBF6] text-[#222222] ring-2 ring-[#9A5B24] font-bold' : 'opacity-70'}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-neutral-300 bg-[#FDFBF6]" />
              <span className="hidden xl:inline">Pergamino</span>
            </Button>

            <Button
              variant={settings.theme === 'sepia' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onUpdateSettings({ theme: 'sepia' })}
              aria-label="Modo Sepia Académico"
              className={settings.theme === 'sepia' ? 'bg-[#F5EFEB] text-[#2B261F] ring-2 ring-[#784421] font-bold' : 'opacity-70'}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-neutral-300 bg-[#F5EFEB]" />
              <span className="hidden xl:inline">Sepia</span>
            </Button>

            <Button
              variant={settings.theme === 'noche' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onUpdateSettings({ theme: 'noche' })}
              aria-label="Modo Noche Suave"
              className={settings.theme === 'noche' ? 'bg-[#1A1A1A] text-[#E8E8E8] ring-2 ring-[#D4A373] font-bold' : 'opacity-70'}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-neutral-600 bg-[#1A1A1A]" />
              <span className="hidden xl:inline">Noche</span>
            </Button>
          </div>
        </div>

        {/* Right: Audio Narrator, Bookmarks, Shortcuts, Fullscreen, Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {onToggleAudioNarrator && (
            <Button
              variant={isAudioNarratorActive ? "default" : "outline"}
              size="icon-sm"
              onClick={onToggleAudioNarrator}
              aria-label={isAudioNarratorActive ? "Ocultar narrador de audio" : "Activar narrador de audio bíblico"}
              title="Narrador en Audio (TTS Bimodal)"
            >
              <Volume2 className={`h-4 w-4 ${isAudioNarratorActive ? 'animate-pulse' : 'text-reader-accent'}`} />
            </Button>
          )}

          {onOpenBookmarks && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenBookmarks}
              aria-label="Ver versículos guardados"
              title="Versículos Guardados"
            >
              <BookMarked className="h-4 w-4 text-reader-accent" />
              {bookmarksCount > 0 && (
                <Badge variant="default" className="h-4 min-w-[16px] px-1 text-[10px] font-bold">
                  {bookmarksCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Keyboard shortcut icon only on sm+ */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowShortcutsModal(true)}
            aria-label="Ver atajos de teclado y ayuda"
            className="hidden sm:flex"
            title="Atajos de teclado"
          >
            <Keyboard className="h-4.5 w-4.5 opacity-80" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Activar pantalla completa'}
            title="Pantalla Completa (F11)"
          >
            {isFullscreen ? <Minimize className="h-4 w-4 sm:h-4.5 sm:w-4.5 opacity-80" /> : <Maximize className="h-4 w-4 sm:h-4.5 sm:w-4.5 opacity-80" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            aria-expanded={showSettingsDrawer}
            aria-label="Abrir panel de ajustes de lectura y accesibilidad"
          >
            <Settings className="h-4 w-4 text-reader-accent" />
            <span className="hidden sm:inline">Ajustes</span>
          </Button>
        </div>
      </motion.header>
    )}
  </AnimatePresence>

      {/* Slide-out Accessibility Settings Drawer */}
      <Dialog
        isOpen={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        position="right"
        title="Ajustes de Confort E-Ink"
        className="max-w-md h-full pb-safe"
      >
        <DialogHeader onClose={() => setShowSettingsDrawer(false)}>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-reader-accent" />
            <DialogTitle>Ajustes de Confort E-Ink</DialogTitle>
          </div>
        </DialogHeader>

        <DialogContent className="space-y-6 max-h-[85vh]">
          {/* 1. Theme Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
              Paleta Cromática (Sin Glare / WCAG AAA)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={settings.theme === 'pergamino' ? 'default' : 'outline'}
                onClick={() => onUpdateSettings({ theme: 'pergamino' })}
                className={`flex-col h-auto p-3 ${
                  settings.theme === 'pergamino'
                    ? 'ring-2 ring-[#9A5B24] bg-[#9A5B24]/15 font-bold shadow-xs text-[var(--reader-text)]'
                    : ''
                }`}
              >
                <span className="h-6 w-6 rounded-full border border-neutral-300 bg-[#FDFBF6] mb-1" />
                <span className="text-xs">Pergamino</span>
              </Button>

              <Button
                variant={settings.theme === 'sepia' ? 'default' : 'outline'}
                onClick={() => onUpdateSettings({ theme: 'sepia' })}
                className={`flex-col h-auto p-3 ${
                  settings.theme === 'sepia'
                    ? 'ring-2 ring-[#784421] bg-[#784421]/15 font-bold shadow-xs text-[var(--reader-text)]'
                    : ''
                }`}
              >
                <span className="h-6 w-6 rounded-full border border-neutral-300 bg-[#F5EFEB] mb-1" />
                <span className="text-xs">Sepia</span>
              </Button>

              <Button
                variant={settings.theme === 'noche' ? 'default' : 'outline'}
                onClick={() => onUpdateSettings({ theme: 'noche' })}
                className={`flex-col h-auto p-3 ${
                  settings.theme === 'noche'
                    ? 'ring-2 ring-[#D4A373] bg-[#D4A373]/20 font-bold shadow-xs text-white'
                    : ''
                }`}
              >
                <span className="h-6 w-6 rounded-full border border-neutral-600 bg-[#1A1A1A] mb-1" />
                <span className="text-xs">Noche</span>
              </Button>
            </div>
          </div>

          {/* 2. Typographic Families */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
              Tipografía de Accesibilidad Cognitiva
            </label>
            <div className="space-y-2">
              <Button
                variant={settings.font === 'bookerly' ? 'subtle' : 'outline'}
                onClick={() => onUpdateSettings({ font: 'bookerly' })}
                className={`w-full justify-between p-3.5 h-auto text-left ${settings.font === 'bookerly' ? 'ring-2 ring-reader-accent font-bold' : ''}`}
              >
                <span className="font-serif text-base">Bookerly / Literata (Serif Kindle)</span>
                {settings.font === 'bookerly' && (
                  <Badge variant="subtle">Activa</Badge>
                )}
              </Button>

              <Button
                variant={settings.font === 'atkinson' ? 'subtle' : 'outline'}
                onClick={() => onUpdateSettings({ font: 'atkinson' })}
                className={`w-full justify-between p-3.5 h-auto text-left ${settings.font === 'atkinson' ? 'ring-2 ring-reader-accent font-bold' : ''}`}
              >
                <div className="flex flex-col">
                  <span className="font-sans text-base">Atkinson Hyperlegible</span>
                  <span className="text-xs opacity-70">Braille Institute (Anti-homóglifos)</span>
                </div>
                {settings.font === 'atkinson' && (
                  <Badge variant="subtle">Activa</Badge>
                )}
              </Button>

              <Button
                variant={settings.font === 'opendyslexic' ? 'subtle' : 'outline'}
                onClick={() => onUpdateSettings({ font: 'opendyslexic' })}
                className={`w-full justify-between p-3.5 h-auto text-left ${settings.font === 'opendyslexic' ? 'ring-2 ring-reader-accent font-bold' : ''}`}
              >
                <div className="flex flex-col">
                  <span className="text-base" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>OpenDyslexic</span>
                  <span className="text-xs opacity-70">Gravedad inferior para dislexia</span>
                </div>
                {settings.font === 'opendyslexic' && (
                  <Badge variant="subtle">Activa</Badge>
                )}
              </Button>
            </div>
          </div>

          {/* 3. Font Size Slider */}
          <Card className="p-4 bg-[var(--reader-hover)]">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-serif opacity-80">Aa</span>
                <label className="text-xs font-bold uppercase tracking-wider">
                  Tamaño de Fuente
                </label>
              </div>
              <Badge variant="secondary" className="font-mono text-xs font-bold">
                {settings.fontSize} px
              </Badge>
            </div>
            <p className="text-xs opacity-70 mb-2">
              Ajusta la escala tipográfica según tu agudeza visual y distancia de lectura.
            </p>
            <Slider
              min={16}
              max={28}
              step={1}
              value={settings.fontSize}
              onValueChange={(val) => onUpdateSettings({ fontSize: val })}
              label="Ajustar tamaño de fuente"
            />
          </Card>

          {/* 4. Software PWM Dimming (Mitigación de Parpadeo) */}
          <Card className="p-4 bg-[var(--reader-hover)]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <SunMedium className="h-4 w-4 text-reader-accent" />
                <label className="text-xs font-bold uppercase tracking-wider">
                  Luminancia por Software (PWM Free)
                </label>
              </div>
              <Badge variant="secondary" className="font-mono text-xs font-bold">
                {Math.round(settings.softwareBrightness * 100)}%
              </Badge>
            </div>
            <p className="text-xs opacity-70 mb-2">
              Atenúa la luz emitida por GPU sin reducir el brillo físico del monitor, previniendo el parpadeo PWM y dolor ocular.
            </p>
            <Slider
              min={0.3}
              max={1.0}
              step={0.05}
              value={settings.softwareBrightness}
              onValueChange={(val) => onUpdateSettings({ softwareBrightness: val })}
              label="Ajustar atenuación por software"
            />
          </Card>

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
                <Button
                  key={mode}
                  variant={settings.lineFocus === mode ? "default" : "outline"}
                  size="default"
                  onClick={() => onUpdateSettings({ lineFocus: mode })}
                  className={settings.lineFocus === mode ? "font-bold shadow-xs" : ""}
                >
                  {mode === 'off' ? 'Apagado' : mode.replace('-line', ' L')}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts & Accessibility Guide Modal */}
      <Dialog
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        position="center"
        title="Navegación y Atajos de Accesibilidad"
        className="max-w-lg"
      >
        <DialogHeader onClose={() => setShowShortcutsModal(false)}>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-reader-accent" />
            <DialogTitle>Navegación y Atajos de Accesibilidad</DialogTitle>
          </div>
        </DialogHeader>

        <DialogContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-[var(--reader-border)] py-2">
            <span>Página Siguiente / Capítulo Siguiente</span>
            <div className="flex gap-1 font-mono text-xs">
              <kbd className="rounded-md border border-[var(--reader-border)] px-2 py-1 bg-neutral-500/10">Flecha Derecha</kbd>
              <kbd className="rounded-md border border-[var(--reader-border)] px-2 py-1 bg-neutral-500/10">Espacio</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--reader-border)] py-2">
            <span>Página Anterior / Capítulo Anterior</span>
            <div className="flex gap-1 font-mono text-xs">
              <kbd className="rounded-md border border-[var(--reader-border)] px-2 py-1 bg-neutral-500/10">Flecha Izquierda</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--reader-border)] py-2">
            <span>Mover Enfoque de Línea (TDAH)</span>
            <div className="flex gap-1 font-mono text-xs">
              <kbd className="rounded-md border border-[var(--reader-border)] px-2 py-1 bg-neutral-500/10">Alt + Arriba / Abajo</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--reader-border)] py-2">
            <span>Mostrar/Ocultar Barras (Modo Inmersivo)</span>
            <div className="flex gap-1 font-mono text-xs">
              <kbd className="rounded-md border border-[var(--reader-border)] px-2 py-1 bg-neutral-500/10">Clic en centro</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span>Cerrar Ventanas y Modales</span>
            <div className="flex gap-1 font-mono text-xs">
              <kbd className="rounded-md border border-[var(--reader-border)] px-2 py-1 bg-neutral-500/10">Escape</kbd>
            </div>
          </div>

          <Card className="mt-4 p-3 bg-[var(--reader-hover)] text-xs leading-relaxed">
            <strong>Estándar WCAG 2.2 AAA:</strong> Todas las áreas táctiles tienen un tamaño mínimo de 44x44px, los ratios de contraste superan 12:1 y los colores se adaptan específicamente a la luminancia del modo seleccionado.
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
};
