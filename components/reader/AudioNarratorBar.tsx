'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  X,
  Gauge,
  UserCheck,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TTSStatus, TTSVoiceOption } from '@/types/bible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AudioNarratorBarProps {
  status: TTSStatus;
  currentVerseNumber: string | number | null;
  bookName: string;
  chapterNumber: number;
  rate: number;
  availableVoices: TTSVoiceOption[];
  selectedVoiceURI: string | null;
  onPlay: () => void;
  onStop: () => void;
  onNextVerse: () => void;
  onPrevVerse: () => void;
  onSetRate: (rate: number) => void;
  onSetVoice: (voiceURI: string) => void;
  onClose: () => void;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const AudioNarratorBar: React.FC<AudioNarratorBarProps> = ({
  status,
  currentVerseNumber,
  bookName,
  chapterNumber,
  rate,
  availableVoices,
  selectedVoiceURI,
  onPlay,
  onStop,
  onNextVerse,
  onPrevVerse,
  onSetRate,
  onSetVoice,
  onClose,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const isPlaying = status === 'playing';
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-minimize after 4 seconds of inactivity during playback
  const resetAutoHideTimer = () => {
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
      autoHideTimeoutRef.current = null;
    }

    if (isPlaying && !showSpeedMenu && !showVoiceMenu) {
      autoHideTimeoutRef.current = setTimeout(() => {
        setIsMinimized(true);
      }, 4000);
    }
  };

  useEffect(() => {
    if (isPlaying && !showSpeedMenu && !showVoiceMenu) {
      resetAutoHideTimer();
    } else {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(reader-hygiene): dead component, delete or merge with ReaderFooter
      setIsMinimized(false);
    }

    return () => {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, [isPlaying, showSpeedMenu, showVoiceMenu, currentVerseNumber]);

  return (
    <AnimatePresence mode="wait">
      {isMinimized ? (
        /* Slim Compact Floating Audio Pill (Zero visual clutter while reading) */
        <motion.div
          key="minimized-narrator-pill"
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-14 sm:bottom-16 right-3 sm:right-6 z-40 select-none"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={() => setIsMinimized(false)}
                className="flex items-center gap-2 rounded-full border shadow-xl backdrop-blur-md px-3.5 py-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                style={{
                  backgroundColor: 'var(--reader-bg)',
                  borderColor: 'var(--reader-border)',
                  color: 'var(--reader-text)',
                }}
              >
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Volume2 className="h-4 w-4 text-reader-accent" />
                <span className="text-xs font-bold font-sans">
                  v.{currentVerseNumber || '1'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStop();
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-reader-accent text-white shadow-xs ml-1"
                  aria-label="Detener audio"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
      setIsMinimized(false); // eslint-disable-line react-hooks/set-state-in-effect -- TODO(reader-hygiene): dead component, delete or merge with ReaderFooter
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-neutral-500/15"
                  aria-label="Expandir controles"
                >
                  <Maximize2 className="h-3 w-3 opacity-70" />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">Toca para expandir controles de audio</TooltipContent>
          </Tooltip>
        </motion.div>
      ) : (
        /* Full Controls Floating HUD */
        <motion.div
          key="full-narrator-bar"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 25 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onMouseMove={resetAutoHideTimer}
          onTouchStart={resetAutoHideTimer}
          className="fixed bottom-14 sm:bottom-16 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-xl sm:w-full select-none"
        >
          <div
            className="rounded-2xl border shadow-2xl backdrop-blur-lg px-3.5 sm:px-5 py-2.5 flex flex-col gap-2 transition-colors duration-200"
            style={{
              backgroundColor: 'var(--reader-bg)',
              borderColor: 'var(--reader-border)',
              color: 'var(--reader-text)',
            }}
          >
            {/* Top Mini Info Bar */}
            <div className="flex items-center justify-between text-xs border-b pb-1.5" style={{ borderColor: 'var(--reader-border)' }}>
              <div className="flex items-center gap-2 font-medium truncate max-w-[60%]">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="flex items-center gap-1 truncate">
                  <Volume2 className="h-3.5 w-3.5 text-reader-accent shrink-0" />
                  <span className="font-bold truncate text-[11px] sm:text-xs">
                    {bookName} {chapterNumber}
                    {currentVerseNumber ? ` : v.${currentVerseNumber}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Speed Button */}
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSpeedMenu(!showSpeedMenu);
                          setShowVoiceMenu(false);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border transition-colors hover:bg-neutral-500/10 active:scale-95"
                        style={{ borderColor: 'var(--reader-border)' }}
                        aria-label={`Velocidad actual: ${rate}x`}
                      >
                        <Gauge className="h-3 w-3" />
                        <span>{rate}x</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Velocidad de reproducción</TooltipContent>
                  </Tooltip>

                  {/* Speed Popover */}
                  {showSpeedMenu && (
                    <div
                      className="absolute bottom-full right-0 mb-2 rounded-xl border p-1 shadow-xl flex flex-col gap-0.5 min-w-[90px] z-50 animate-in fade-in zoom-in-95 duration-100"
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
                            onSetRate(speed);
                            setShowSpeedMenu(false);
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-left transition-colors ${
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

                {/* Voices Button */}
                {availableVoices.length > 0 && (
                  <div className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => {
                            setShowVoiceMenu(!showVoiceMenu);
                            setShowSpeedMenu(false);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors hover:bg-neutral-500/10 active:scale-95"
                          style={{ borderColor: 'var(--reader-border)' }}
                        >
                          <UserCheck className="h-3 w-3" />
                          <span className="hidden sm:inline">Voz</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Cambiar voz de narración</TooltipContent>
                    </Tooltip>

                    {/* Voice Popover */}
                    {showVoiceMenu && (
                      <div
                        className="absolute bottom-full right-0 mb-2 rounded-xl border p-1.5 shadow-xl flex flex-col gap-1 max-h-56 overflow-y-auto w-56 sm:w-64 z-50 animate-in fade-in zoom-in-95 duration-100"
                        style={{
                          backgroundColor: 'var(--reader-bg)',
                          borderColor: 'var(--reader-border)',
                        }}
                      >
                        <span className="text-[10px] font-bold opacity-60 px-2 py-1 uppercase">Voces Disponibles</span>
                        {availableVoices.map((voice, idx) => {
                          const isSelected = selectedVoiceURI === voice.voiceURI;
                          return (
                            <Tooltip key={`voice-${voice.voiceURI || voice.name}-${idx}`}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSetVoice(voice.voiceURI);
                                    setShowVoiceMenu(false);
                                  }}
                                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors truncate ${
                                    isSelected ? 'bg-reader-accent font-bold shadow-xs' : 'hover:bg-neutral-500/10'
                                  }`}
                                >
                                  <span className="truncate">{voice.name}</span>
                                  {isSelected && <span className="ml-1 shrink-0">✓</span>}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">{voice.name}</TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Close Narrator Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-neutral-500/15 transition-colors"
                  aria-label="Cerrar narrador de audio"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Main Controls Row */}
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {/* Previous Verse */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onPrevVerse}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors hover:bg-neutral-500/10 active:scale-95"
                    style={{ borderColor: 'var(--reader-border)' }}
                    aria-label="Versículo anterior"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Versículo Anterior</TooltipContent>
              </Tooltip>

              {/* Center: Play / Stop Toggle */}
              <button
                type="button"
                onClick={isPlaying ? onStop : onPlay}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-reader-accent font-bold text-sm shadow-md transition-all active:scale-98 hover:opacity-95"
                aria-label={isPlaying ? 'Detener narración' : 'Reproducir narración'}
              >
                {isPlaying ? (
                  <>
                    <Square className="h-4 w-4 fill-current" />
                    <span>Detener</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Escuchar</span>
                  </>
                )}
              </button>

              {/* Next Verse */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onNextVerse}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors hover:bg-neutral-500/10 active:scale-95"
                    style={{ borderColor: 'var(--reader-border)' }}
                    aria-label="Siguiente versículo"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Siguiente Versículo</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
