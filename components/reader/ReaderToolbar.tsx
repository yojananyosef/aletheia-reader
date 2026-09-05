'use client';

import React, { useState } from 'react';
import {
  ReaderSettings,
  LineFocusMode,
  TranslationId,
  AVAILABLE_TRANSLATIONS,
  type TranslationMeta,
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
  Search,
  MoveHorizontal,
  AlignJustify,
  Type,
  RotateCcw,
  Scale,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VersionSelector } from './VersionSelector';

interface ReaderToolbarProps {
  settings: ReaderSettings;
  onUpdateSettings: (updates: Partial<ReaderSettings>) => void;
  onOpenBookSelector?: () => void;
  onOpenBookmarks?: () => void;
  bookmarksCount?: number;
  onToggleAudioNarrator?: () => void;
  isAudioNarratorActive?: boolean;
  selectedVersionId?: TranslationId;
  onSelectVersion?: (id: TranslationId) => void;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  settings,
  onUpdateSettings,
  onOpenBookSelector,
  onOpenBookmarks,
  bookmarksCount = 0,
  onToggleAudioNarrator,
  isAudioNarratorActive = false,
  selectedVersionId = 'ONBV',
  onSelectVersion,
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showLicensesModal, setShowLicensesModal] = useState(false);
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
      {settings.showToolbar && (
          <header
            role="banner"
            className="animate-toolbar-in sticky top-0 z-20 flex w-full items-center justify-between border-b border-[var(--reader-border)] bg-[var(--reader-bg)] text-[var(--reader-text)] px-3 sm:px-5 py-2 backdrop-blur-md transition-colors duration-200 select-none shadow-2xs shrink-0 overflow-visible"
          >
        {/* Left: Brand & Bible Explorer / Books Selector Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-reader-accent shrink-0" />
            <span className="font-bold tracking-wide uppercase text-xs hidden lg:inline opacity-80">
              Aletheia Reader
            </span>
          </div>

          {/* Clean 'Libros' Selector Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenBookSelector}
                className="font-bold text-xs sm:text-sm gap-1.5"
                aria-label="Explorar libros y capítulos de la Biblia"
              >
                <Search className="h-3.5 w-3.5 opacity-70" />
                <span>Libros</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Explorar libros y capítulos</TooltipContent>
          </Tooltip>

          {/* Version Pill — solo desktop, en móvil está en Ajustes para respetar espacio */}
          {onSelectVersion && (
            <div className="hidden sm:block">
              <VersionSelector
                selectedVersionId={selectedVersionId}
                onSelectVersion={onSelectVersion}
                variant="pill"
              />
            </div>
          )}
        </div>

        {/* Right: Audio Narrator, Bookmarks, Shortcuts, Fullscreen, Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {onToggleAudioNarrator && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isAudioNarratorActive ? "default" : "outline"}
                  size="icon-sm"
                  onClick={onToggleAudioNarrator}
                  aria-label={isAudioNarratorActive ? "Ocultar narrador de audio" : "Activar narrador de audio bíblico"}
                >
                  <Volume2 className={`h-4 w-4 ${isAudioNarratorActive ? 'animate-pulse' : 'text-reader-accent'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Narrador en Audio (TTS Bimodal)</TooltipContent>
            </Tooltip>
          )}

          {onOpenBookmarks && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenBookmarks}
                  aria-label="Ver versículos guardados"
                >
                  <BookMarked className="h-4 w-4 text-reader-accent" />
                  {bookmarksCount > 0 && (
                    <Badge variant="default" className="h-4 min-w-[16px] px-1 text-[10px] font-bold">
                      {bookmarksCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Versículos Guardados</TooltipContent>
            </Tooltip>
          )}

          {/* Fullscreen */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Activar pantalla completa'}
              >
                {isFullscreen ? <Minimize className="h-4 w-4 sm:h-4.5 sm:w-4.5 opacity-80" /> : <Maximize className="h-4 w-4 sm:h-4.5 sm:w-4.5 opacity-80" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Pantalla Completa (F11)</TooltipContent>
          </Tooltip>

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
      </header>
    )}

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
          {/* 0. Translation Selection */}
          {onSelectVersion && (
            <VersionSelector
              selectedVersionId={selectedVersionId}
              onSelectVersion={onSelectVersion}
              variant="cards"
            />
          )}

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
                <label htmlFor="slider-font-size" className="text-xs font-bold uppercase tracking-wider">
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
              id="slider-font-size"
              value={settings.fontSize}
              onValueChange={(val) => onUpdateSettings({ fontSize: val })}
              label="Ajustar tamaño de fuente"
            />
          </Card>

          {/* 3b. Line Height Slider */}
          <Card className="p-4 bg-[var(--reader-hover)]">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <AlignJustify className="h-4 w-4 text-reader-accent" />
                <label htmlFor="slider-line-height" className="text-xs font-bold uppercase tracking-wider">
                  Interlineado
                </label>
              </div>
              <Badge variant="secondary" className="font-mono text-xs font-bold">
                {settings.lineHeight}
              </Badge>
            </div>
            <p className="text-xs opacity-70 mb-2">
              Espacio entre líneas. Valores mayores mejoran la legibilidad para dislexia.
            </p>
            <Slider
              min={1.2}
              max={2.5}
              step={0.1}
              id="slider-line-height"
              value={settings.lineHeight}
              onValueChange={(val) => onUpdateSettings({ lineHeight: val })}
              label="Ajustar interlineado"
            />
          </Card>

          {/* 3c. Letter Spacing Slider */}
          <Card className="p-4 bg-[var(--reader-hover)]">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <MoveHorizontal className="h-4 w-4 text-reader-accent" />
                <label htmlFor="slider-letter-spacing" className="text-xs font-bold uppercase tracking-wider">
                  Espaciado
                </label>
              </div>
              <Badge variant="secondary" className="font-mono text-xs font-bold">
                {settings.letterSpacing?.toFixed(2) ?? '0.02'} em
              </Badge>
            </div>
            <p className="text-xs opacity-70 mb-2">
              Espacio entre letras. Incrementar ayuda a separar caracteres confundidos.
            </p>
            <Slider
              min={0}
              max={0.1}
              step={0.01}
              id="slider-letter-spacing"
              value={settings.letterSpacing ?? 0.02}
              onValueChange={(val) => onUpdateSettings({ letterSpacing: val })}
              label="Ajustar espaciado entre letras"
            />
          </Card>

          {/* 3d. Dyslexia Reading Aids */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Type className="h-4 w-4 text-reader-accent" />
              <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                Herramientas Neurocognitivas
              </label>
            </div>

            {/* Bionic Reading Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--reader-border)] bg-[var(--reader-hover)]">
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 opacity-60" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Lectura Biónica</span>
                  <span className="text-[10px] opacity-60">Resalta puntos de fijación sacádica</span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.bionicReading ?? false}
                onClick={() => onUpdateSettings({ bionicReading: !(settings.bionicReading ?? false) })}
                className="w-11 h-6 rounded-full transition-all duration-200 relative shadow-inner cursor-pointer"
                style={{
                  backgroundColor: settings.bionicReading
                    ? 'var(--reader-accent)'
                    : 'color-mix(in srgb, var(--reader-text), transparent 75%)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-md transition-all duration-200 ${
                    settings.bionicReading ? 'left-[22px]' : 'left-0.5'
                  }`}
                  style={{
                    backgroundColor: 'var(--reader-bg)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>

            {/* Syllable Points Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--reader-border)] bg-[var(--reader-hover)]">
              <div className="flex items-center gap-3">
                <AlignJustify className="w-5 h-5 opacity-60" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Puntos Silábicos</span>
                  <span className="text-[10px] opacity-60">Facilita decodificación fonológica</span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.phoneticDots ?? false}
                onClick={() => onUpdateSettings({ phoneticDots: !(settings.phoneticDots ?? false) })}
                className="w-11 h-6 rounded-full transition-all duration-200 relative shadow-inner cursor-pointer"
                style={{
                  backgroundColor: settings.phoneticDots
                    ? 'var(--reader-accent)'
                    : 'color-mix(in srgb, var(--reader-text), transparent 75%)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-md transition-all duration-200 ${
                    settings.phoneticDots ? 'left-[22px]' : 'left-0.5'
                  }`}
                  style={{
                    backgroundColor: 'var(--reader-bg)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
          </div>

          {/* 4. Software PWM Dimming (Mitigación de Parpadeo) */}
          <Card className="p-4 bg-[var(--reader-hover)]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <SunMedium className="h-4 w-4 text-reader-accent" />
                <label htmlFor="slider-brightness" className="text-xs font-bold uppercase tracking-wider">
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
              id="slider-brightness"
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

            {/* 6. Restore Defaults Button */}
            <div className="pt-3 border-t border-[var(--reader-border)]">
              <Button
                variant="outline"
                size="default"
                className="w-full justify-center gap-2"
                onClick={() => onUpdateSettings({
                  fontSize: 18,
                  lineHeight: 1.6,
                  letterSpacing: 0.02,
                  fontWeight: 400,
                  bionicReading: false,
                  phoneticDots: false,
                })}
                aria-label="Restablecer valores tipográficos recomendados"
              >
                <RotateCcw className="h-4 w-4 text-reader-accent" />
                <span>Restaurar valores</span>
              </Button>
            </div>

            {/* 7. Keyboard Shortcuts & Accessibility Guide */}
            <div className="pt-3 border-t border-[var(--reader-border)]">
              <Button
                variant="outline"
                size="default"
                className="w-full justify-center gap-2"
                onClick={() => {
                  setShowSettingsDrawer(false);
                  setShowShortcutsModal(true);
                }}
                aria-label="Ver atajos de teclado y ayuda"
              >
                <Keyboard className="h-4 w-4 text-reader-accent" />
                <span>Atajos de teclado y ayuda</span>
              </Button>
            </div>

            {/* 8. Licencias de las Biblias */}
            <div className="pt-3 border-t border-[var(--reader-border)]">
              <Button
                variant="outline"
                size="default"
                className="w-full justify-center gap-2"
                onClick={() => {
                  setShowSettingsDrawer(false);
                  setShowLicensesModal(true);
                }}
                aria-label="Ver licencias de las traducciones bíblicas"
              >
                <Scale className="h-4 w-4 text-reader-accent" />
                <span>Licencias y atribución</span>
              </Button>
              <p className="text-[11px] opacity-50 mt-1.5 text-center">
                Solo versiones de dominio público o Creative Commons.
              </p>
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
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--reader-border)] py-2">
            <span>Página Anterior / Capítulo Anterior</span>
            <div className="flex gap-1 font-mono text-xs">
              <kbd className="rounded-md border border-[var(--reader-border)] px-2 py-1 bg-neutral-500/10">Flecha Izquierda</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--reader-border)] py-2">
            <span>Enfoque TDAH (Fijar / Seguir ratón)</span>
            <div className="flex gap-1 font-mono text-xs">
              <kbd className="rounded-md border border-[var(--reader-border)] px-2 py-1 bg-neutral-500/10">Espacio</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--reader-border)] py-2">
            <span>Subir / Bajar Enfoque de Línea Fija</span>
            <div className="flex gap-1 font-mono text-xs">
              <kbd className="rounded-md border border-[var(--reader-border)] px-2 py-1 bg-neutral-500/10">Arriba / Abajo</kbd>
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

      {/* Licenses & Attribution Modal */}
      <Dialog
        isOpen={showLicensesModal}
        onClose={() => setShowLicensesModal(false)}
        position="center"
        title="Licencias y atribución"
        className="max-w-2xl"
      >
        <DialogHeader onClose={() => setShowLicensesModal(false)}>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-reader-accent" />
            <DialogTitle>Licencias de las traducciones</DialogTitle>
          </div>
        </DialogHeader>

        <DialogContent className="space-y-4">
          <Card className="p-3 bg-[var(--reader-hover)] text-xs leading-relaxed flex gap-2">
            <ShieldCheck className="h-4 w-4 text-reader-accent shrink-0 mt-0.5" />
            <div>
              <strong>Aletheia Reader</strong> solo distribuye traducciones en <strong>dominio público</strong> o bajo <strong>Creative Commons</strong>. Cada archivo <code className="px-1 py-0.5 rounded bg-neutral-500/10 font-mono text-[11px]">public/data/bibles/*/bible.json</code> incluye su <code className="font-mono text-[11px]">copyright</code>, <code className="font-mono text-[11px]">license</code> y <code className="font-mono text-[11px]">licenseUrl</code>. Respeta la licencia al reutilizar textos.
            </div>
          </Card>

          <div className="grid gap-2">
            {(Object.values(AVAILABLE_TRANSLATIONS) as TranslationMeta[]).map((meta) => (
              <Card key={meta.id} className="p-3 flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">{meta.shortName}</span>
                      {meta.hasDeuterocanonical && (
                        <Badge variant="subtle" className="text-[9px] px-1.5 py-0">
                          73 libros
                        </Badge>
                      )}
                      <span className="text-xs opacity-60">· {meta.year}</span>
                    </div>
                    <div className="text-sm font-medium leading-tight">{meta.name}</div>
                    <div className="text-xs opacity-70">{meta.description}</div>
                    <div className="text-[11px] opacity-50">Fuente: {meta.source}</div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {meta.license}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="opacity-60">{meta.copyright}</span>
                  {meta.licenseUrl && (
                    <a
                      href={meta.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-reader-accent hover:underline font-medium"
                    >
                      Ver licencia <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-3 bg-[var(--reader-hover)] text-xs leading-relaxed">
            <strong>¿Cómo reutilizar?</strong> Dominio público: libre sin atribución obligatoria (se agradece). CC BY / BY-SA: atribución + comparte igual. CC BY-NC-ND: solo uso personal, sin derivados comerciales. Consulta siempre el <code className="font-mono text-[11px]">licenseUrl</code> de cada versión antes de publicar.
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
};
