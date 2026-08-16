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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
          ? 'border-t border-[var(--reader-border)] px-3.5 sm:px-6 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] backdrop-blur-md shadow-md bg-[var(--reader-bg)] text-[var(--reader-text)]'
          : 'border-t-0 px-3.5 sm:px-6 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] bg-transparent'
      }`}
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
            className="flex flex-col gap-1.5 pt-0.5 relative overflow-visible"
          >
            {/* Click Outside Overlay for Popovers */}
            {(showSpeedMenu || showVoiceMenu) && (
              <div
                className="fixed inset-0 z-30 bg-transparent"
                onClick={() => {
                  setShowSpeedMenu(false);
                  setShowVoiceMenu(false);
                }}
              />
            )}

            {/* When Audio Narrator is Active: Single-row Compact Media HUD */}
            {isNarratorOpen ? (
              <div className="flex flex-row items-center justify-between gap-1.5 sm:gap-2 py-0.5 relative z-40 w-full">
                {/* Left: Spoken Verse Info & Speed/Voice Popovers */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="flex items-center gap-1 truncate max-w-[110px] xs:max-w-[160px] sm:max-w-[220px]">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <Volume2 className="h-3.5 w-3.5 text-reader-accent shrink-0" />
                    <span className="text-xs font-bold truncate">
                      {bookName} {chapterNumber}:v.{currentVerseNumber || '1'}
                    </span>
                  </div>

                  {/* Speed & Voice Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Speed Selector */}
                    {onSetRateTTS && (
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowSpeedMenu(!showSpeedMenu);
                            setShowVoiceMenu(false);
                          }}
                          className="h-7 px-1.5 font-mono font-bold text-[11px]"
                          title="Velocidad de voz"
                        >
                          <Gauge className="h-3 w-3" />
                          <span>{rate}x</span>
                        </Button>

                        {showSpeedMenu && (
                          <div
                            className="absolute bottom-full left-0 mb-2 rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bg)] p-1 shadow-2xl flex flex-col gap-0.5 min-w-[90px] z-50 animate-in fade-in zoom-in-95 duration-100"
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
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-left transition-colors ${
                                  rate === speed ? 'bg-reader-accent text-reader-accent-fg shadow-xs' : 'hover:bg-neutral-500/10'
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowVoiceMenu(!showVoiceMenu);
                            setShowSpeedMenu(false);
                          }}
                          className="h-7 px-1.5 text-[11px]"
                          title="Cambiar voz"
                        >
                          <UserCheck className="h-3 w-3" />
                          <span className="hidden sm:inline">Voz</span>
                        </Button>

                        {showVoiceMenu && (
                          <div
                            className="absolute bottom-full left-0 sm:left-auto sm:right-0 mb-2 rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bg)] p-1.5 shadow-2xl flex flex-col gap-1 max-h-52 overflow-y-auto custom-scrollbar w-56 sm:w-64 z-50 animate-in fade-in zoom-in-95 duration-100"
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
                                    isSelected ? 'bg-reader-accent text-reader-accent-fg font-bold shadow-xs' : 'hover:bg-neutral-500/10'
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

                {/* Center: Audio Playback Cluster (SkipBack / Play-Pause / Stop / SkipForward) */}
                <div className="flex items-center justify-center gap-1.5 shrink-0">
                  {onPrevVerseTTS && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onPrevVerseTTS}
                      title="Versículo anterior"
                      aria-label="Escuchar versículo anterior"
                      className="h-8 w-8 min-w-[32px]"
                    >
                      <SkipBack className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  <Button
                    variant="default"
                    size="icon"
                    onClick={isPlaying ? onPauseTTS : onPlayTTS}
                    className="h-9 w-9 min-w-[36px] font-bold shadow-md"
                    aria-label={isPlaying ? 'Pausar locución' : 'Reproducir locución'}
                    title={isPlaying ? 'Pausar' : ttsStatus === 'paused' ? 'Reanudar' : 'Escuchar'}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    )}
                  </Button>

                  {onStopTTS && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onStopTTS}
                      title="Detener Audio"
                      aria-label="Detener audio"
                      className="h-9 w-9 min-w-[36px]"
                    >
                      <Square className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  {onNextVerseTTS && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onNextVerseTTS}
                      title="Versículo siguiente"
                      aria-label="Escuchar versículo siguiente"
                      className="h-8 w-8 min-w-[32px]"
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Right: Close Narrator Button */}
                <div className="flex items-center justify-end shrink-0">
                  {onCloseNarrator && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onCloseNarrator}
                      title="Cerrar barra de audio"
                      aria-label="Cerrar narrador de audio"
                      className="h-8 w-8 opacity-70 hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* Standard Ambient Reading Progress Footer (Pure info, 0 navigation buttons) */
              <div className="flex items-center justify-between py-1 text-xs select-none">
                {/* Left: Book Name & Estimated Time */}
                <div className="flex items-center gap-1.5 opacity-70 font-medium truncate max-w-[200px] xs:max-w-[260px]">
                  <span>{bookName} {chapterNumber}</span>
                  <span className="opacity-40">•</span>
                  <span>~{estimatedMinutes} min</span>
                </div>

                {/* Right: Page Indicator & Percentage */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono font-bold tracking-wider" aria-live="polite">
                    Pág. {currentPage}/{totalPages}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {percentage}%
                  </Badge>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
};
