'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  X,
  Gauge,
  UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TTSStatus, TTSVoiceOption } from '@/types/bible';

interface ReaderFooterProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  bookName: string;
  chapterNumber: number;
  totalWords?: number;
  showControls?: boolean;
  // Audio Narrator props
  isNarratorOpen?: boolean;
  ttsStatus?: TTSStatus;
  currentVerseNumber?: string | number | null;
  rate?: number;
  availableVoices?: TTSVoiceOption[];
  selectedVoiceURI?: string | null;
  onPlayTTS?: () => void;
  onPauseTTS?: () => void;
  onStopTTS?: () => void;
  onNextVerseTTS?: () => void;
  onPrevVerseTTS?: () => void;
  onSetRateTTS?: (rate: number) => void;
  onSetVoiceTTS?: (voiceURI: string) => void;
  onCloseNarrator?: () => void;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const ReaderFooter: React.FC<ReaderFooterProps> = ({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  bookName,
  chapterNumber,
  totalWords = 500,
  showControls = true,
  isNarratorOpen = false,
  ttsStatus = 'idle',
  currentVerseNumber,
  rate = 1.0,
  availableVoices = [],
  selectedVoiceURI = null,
  onPlayTTS,
  onPauseTTS,
  onStopTTS,
  onNextVerseTTS,
  onPrevVerseTTS,
  onSetRateTTS,
  onSetVoiceTTS,
  onCloseNarrator,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  const percentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const estimatedMinutes = Math.max(1, Math.ceil(totalWords / 200));
  const isPlaying = ttsStatus === 'playing';

  return (
    <footer
      role="contentinfo"
      aria-label="Paginación, estado de lectura y controles de audio"
      className={`sticky bottom-0 z-20 flex w-full flex-col transition-all duration-200 select-none ${
        showControls
          ? 'border-t px-3.5 sm:px-6 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] backdrop-blur-md shadow-md'
          : 'border-t-0 px-3.5 sm:px-6 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] bg-transparent'
      }`}
      style={{
        backgroundColor: showControls ? 'var(--reader-bg)' : 'transparent',
        borderColor: 'var(--reader-border)',
        color: 'var(--reader-text)',
      }}
    >
      {/* Slim Ambient Chapter Progress Bar (Always visible in both normal & immersive modes) */}
      <div className="w-full bg-neutral-500/15 h-1 rounded-full overflow-hidden transition-all mb-1">
        <div
          className="h-full bg-reader-accent transition-all duration-200"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso del capítulo: ${percentage}%`}
        />
      </div>

      {/* Extended Controls (Hidden in Zero-Distraction Immersive Mode / Middle Click) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.12, ease: 'easeInOut' }}
            className="flex flex-col gap-1.5 overflow-hidden pt-0.5"
          >
            {/* When Audio Narrator is Active: Integrated Cohesive Media & Reading HUD */}
            {isNarratorOpen ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-0.5">
                {/* Left: Spoken Verse Info & Speed/Voice Popovers */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px] xs:max-w-[240px]">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <Volume2 className="h-4 w-4 text-reader-accent shrink-0" />
                    <span className="text-xs font-bold truncate">
                      {bookName} {chapterNumber}:v.{currentVerseNumber || '1'}
                    </span>
                  </div>

                  {/* Speed & Voice Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Speed Selector */}
                    {onSetRateTTS && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSpeedMenu(!showSpeedMenu);
                            setShowVoiceMenu(false);
                          }}
                          className="flex h-8 items-center gap-1 px-2 rounded-lg text-[11px] font-mono font-bold border transition-colors hover:bg-neutral-500/10 active:scale-95"
                          style={{ borderColor: 'var(--reader-border)' }}
                          title="Velocidad de voz"
                        >
                          <Gauge className="h-3 w-3" />
                          <span>{rate}x</span>
                        </button>

                        {showSpeedMenu && (
                          <div
                            className="absolute bottom-full left-0 sm:left-auto sm:right-0 mb-2 rounded-xl border p-1 shadow-2xl flex flex-col gap-0.5 min-w-[90px] z-50 animate-in fade-in zoom-in-95 duration-100"
                            style={{
                              backgroundColor: 'var(--reader-bg)',
                              borderColor: 'var(--reader-border)',
                            }}
                          >
                            <span className="text-[10px] font-bold opacity-60 px-2 py-1 uppercase">Velocidad</span>
                            {SPEED_OPTIONS.map((speed) => (
                              <button
                                key={`speed-${speed}`}
                                type="button"
                                onClick={() => {
                                  onSetRateTTS(speed);
                                  setShowSpeedMenu(false);
                                }}
                                className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-mono font-bold text-left transition-colors ${
                                  rate === speed ? 'bg-reader-accent shadow-xs' : 'hover:bg-neutral-500/10'
                                }`}
                              >
                                <span>{speed}x</span>
                                {rate === speed && <span>✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Voice Selector */}
                    {onSetVoiceTTS && availableVoices.length > 0 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowVoiceMenu(!showVoiceMenu);
                            setShowSpeedMenu(false);
                          }}
                          className="flex h-8 items-center gap-1 px-2 rounded-lg text-[11px] font-medium border transition-colors hover:bg-neutral-500/10 active:scale-95"
                          style={{ borderColor: 'var(--reader-border)' }}
                          title="Cambiar voz"
                        >
                          <UserCheck className="h-3 w-3" />
                          <span className="hidden sm:inline">Voz</span>
                        </button>

                        {showVoiceMenu && (
                          <div
                            className="absolute bottom-full right-0 mb-2 rounded-xl border p-1.5 shadow-2xl flex flex-col gap-1 max-h-52 overflow-y-auto w-56 sm:w-64 z-50 animate-in fade-in zoom-in-95 duration-100"
                            style={{
                              backgroundColor: 'var(--reader-bg)',
                              borderColor: 'var(--reader-border)',
                            }}
                          >
                            <span className="text-[10px] font-bold opacity-60 px-2 py-1 uppercase">Voces Disponibles</span>
                            {availableVoices.map((voice, idx) => {
                              const isSelected = selectedVoiceURI === voice.voiceURI;
                              return (
                                <button
                                  key={`voice-${voice.voiceURI || voice.name}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    onSetVoiceTTS(voice.voiceURI);
                                    setShowVoiceMenu(false);
                                  }}
                                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors truncate ${
                                    isSelected ? 'bg-reader-accent font-bold shadow-xs' : 'hover:bg-neutral-500/10'
                                  }`}
                                  title={voice.name}
                                >
                                  <span className="truncate">{voice.name}</span>
                                  {isSelected && <span className="ml-1 shrink-0">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Audio Playback Cluster */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  {onPrevVerseTTS && (
                    <button
                      type="button"
                      onClick={onPrevVerseTTS}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:bg-neutral-500/10 active:scale-95"
                      style={{ borderColor: 'var(--reader-border)' }}
                      title="Versículo Anterior"
                    >
                      <SkipBack className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={isPlaying ? onPauseTTS : onPlayTTS}
                    className="flex h-10 px-4 items-center justify-center gap-1.5 rounded-xl bg-reader-accent font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 hover:opacity-95"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 fill-current" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current" />
                        <span>{ttsStatus === 'paused' ? 'Reanudar' : 'Escuchar'}</span>
                      </>
                    )}
                  </button>

                  {onStopTTS && (
                    <button
                      type="button"
                      onClick={onStopTTS}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:bg-neutral-500/10 active:scale-95"
                      style={{ borderColor: 'var(--reader-border)' }}
                      title="Detener Audio"
                    >
                      <Square className="h-4 w-4" />
                    </button>
                  )}

                  {onNextVerseTTS && (
                    <button
                      type="button"
                      onClick={onNextVerseTTS}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:bg-neutral-500/10 active:scale-95"
                      style={{ borderColor: 'var(--reader-border)' }}
                      title="Siguiente Versículo"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Right: Page Navigation & Close Narrator Button */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={onPrevPage}
                      disabled={currentPage <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-neutral-500/10 disabled:opacity-25 active:scale-95"
                      style={{ borderColor: 'var(--reader-border)' }}
                      title="Página Anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[11px] sm:text-xs font-mono font-bold px-1.5">
                      {currentPage}/{totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={onNextPage}
                      disabled={currentPage >= totalPages}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-neutral-500/10 disabled:opacity-25 active:scale-95"
                      style={{ borderColor: 'var(--reader-border)' }}
                      title="Página Siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {onCloseNarrator && (
                    <button
                      type="button"
                      onClick={onCloseNarrator}
                      className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-500/15 transition-colors"
                      title="Cerrar barra de audio"
                      aria-label="Cerrar narrador de audio"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Standard Reading Progress Footer (When Audio is Closed) */
              <div className="flex items-center justify-between overflow-hidden">
                {/* Left: Previous Page Button & Book Chapter */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onPrevPage}
                    disabled={currentPage <= 1}
                    aria-label="Ir a la página anterior"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors hover:bg-neutral-500/10 disabled:opacity-25 disabled:pointer-events-none active:scale-95 shrink-0"
                    style={{ borderColor: 'var(--reader-border)' }}
                    title="Página Anterior (Flecha Izquierda)"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <span className="hidden md:inline text-xs opacity-70 font-medium font-sans truncate max-w-[200px]">
                    {bookName} {chapterNumber} • ~{estimatedMinutes} min
                  </span>
                </div>

                {/* Center: Page Info (Responsive format) */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="sm:hidden text-xs font-mono font-bold tracking-wider" aria-live="polite">
                    Pág. {currentPage}/{totalPages}
                  </span>
                  <span className="hidden sm:inline text-xs sm:text-sm font-mono font-bold tracking-wider" aria-live="polite">
                    Página {currentPage} de {totalPages}
                  </span>
                  <span className="text-[11px] sm:text-xs opacity-60 font-mono">({percentage}%)</span>
                </div>

                {/* Right: Next Page Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onNextPage}
                    disabled={currentPage >= totalPages}
                    aria-label="Ir a la página siguiente"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors hover:bg-neutral-500/10 disabled:opacity-25 disabled:pointer-events-none active:scale-95 shrink-0"
                    style={{ borderColor: 'var(--reader-border)' }}
                    title="Página Siguiente (Flecha Derecha)"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
};
