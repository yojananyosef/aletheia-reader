'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ComfortBibleReaderProps,
  ReaderSettings,
  Verse,
  ThemeMode,
  TTSStatus,
  TTSVoiceOption,
  TTSState,
} from '@/types/bible';
import { ReaderToolbar } from './ReaderToolbar';
import { ReaderFooter } from './ReaderFooter';
import { ReadingCanvas } from './ReadingCanvas';
import { PaperGrainOverlay } from './PaperGrainOverlay';
import { PwmDimmerOverlay } from './PwmDimmerOverlay';
import { LineFocusOverlay } from './LineFocusOverlay';
import { VerseModal } from './VerseModal';
import { ttsService } from '@/lib/tts-service';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredTTSSettings,
  saveStoredTTSSettings,
  saveStoredReadingPosition,
} from '@/lib/storage-service';

export const ComfortBibleReader: React.FC<ComfortBibleReaderProps> = ({
  data,
  initialVerse,
  theme = 'pergamino',
  onThemeChange,
  onPageChange,
  onBookmarkVerse,
  onNextChapter,
  onPrevChapter,
  onOpenBookSelector,
  onOpenBookmarks,
  bookmarksCount = 0,
}) => {
  // --- Core Reader Settings (Restored from LocalStorage) ---
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const stored = getStoredSettings();
    return { ...stored, theme: theme || stored.theme };
  });

  // Load stored settings and TTS preferences on mount
  useEffect(() => {
    const stored = getStoredSettings();
    setSettings((prev) => ({ ...prev, ...stored }));
    if (stored.theme && onThemeChange && stored.theme !== theme) {
      onThemeChange(stored.theme);
    }

    const storedTTS = getStoredTTSSettings();
    if (storedTTS) {
      setTtsState((prev) => ({
        ...prev,
        rate: storedTTS.rate || 1.0,
        selectedVoiceURI: storedTTS.selectedVoiceURI || prev.selectedVoiceURI,
      }));
    }
  }, []);

  // Effective active theme (prop takes precedence if provided)
  const currentTheme: ThemeMode = theme || settings.theme;

  // Calculate initial page based on initialVerse or stored page if provided
  const getInitialPage = useCallback(() => {
    if (!initialVerse || !data.verses || data.verses.length === 0) return 1;
    const verseIndex = data.verses.findIndex(
      (v) => String(v.number) === String(initialVerse)
    );
    if (verseIndex <= 0) return 1;
    return Math.max(1, Math.ceil(((verseIndex + 1) / data.verses.length) * 4));
  }, [initialVerse, data.verses]);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState<number>(getInitialPage);
  const [totalPages, setTotalPages] = useState<number>(1);

  // --- Bookmarking & Verse Interaction State ---
  const [bookmarkedVerses, setBookmarkedVerses] = useState<(string | number)[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

  // --- Audio Narrator (TTS Bimodal) State ---
  const [isNarratorOpen, setIsNarratorOpen] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<TTSVoiceOption[]>([]);
  const [ttsState, setTtsState] = useState<TTSState>(() => {
    const storedTTS = getStoredTTSSettings();
    return {
      status: 'idle',
      currentVerseIndex: 0,
      currentVerseNumber: null,
      rate: storedTTS?.rate || 1.0,
      selectedVoiceURI: storedTTS?.selectedVoiceURI || null,
    };
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Load Spanish voices on mount
  useEffect(() => {
    const updateVoices = () => {
      const voices = ttsService.getSpanishVoices();
      setAvailableVoices(voices);
      if (voices.length > 0 && !ttsState.selectedVoiceURI) {
        setTtsState((prev) => ({ ...prev, selectedVoiceURI: voices[0].voiceURI }));
      }
    };

    ttsService.onVoicesLoaded(updateVoices);
    updateVoices();
  }, [ttsState.selectedVoiceURI]);

  // Stop TTS on unmount or chapter change
  const prevChapterRef = useRef(`${data.bookId}-${data.chapterNumber}`);
  useEffect(() => {
    const currentKey = `${data.bookId}-${data.chapterNumber}`;
    if (prevChapterRef.current !== currentKey) {
      prevChapterRef.current = currentKey;
      ttsService.cancel();
      setTtsState((prev) => ({
        ...prev,
        status: 'idle',
        currentVerseIndex: 0,
        currentVerseNumber: null,
      }));
    }

    return () => {
      ttsService.cancel();
    };
  }, [data.bookId, data.chapterNumber]);

  // Function to speak verse at specific index
  const speakVerseAtIndex = useCallback(
    (index: number, optionsOverride?: { rate?: number; voiceURI?: string | null }) => {
      if (!data.verses || data.verses.length === 0) return;

      // When finishing the chapter
      if (index >= data.verses.length) {
        ttsService.cancel();
        setTtsState((prev) => ({
          ...prev,
          status: 'idle',
          currentVerseIndex: 0,
          currentVerseNumber: null,
        }));
        if (onNextChapter) {
          onNextChapter();
        }
        return;
      }

      if (index < 0) index = 0;

      const verse = data.verses[index];
      const effectiveRate = optionsOverride?.rate !== undefined ? optionsOverride.rate : ttsState.rate;
      const effectiveVoiceURI =
        optionsOverride?.voiceURI !== undefined
          ? optionsOverride.voiceURI
          : ttsState.selectedVoiceURI;

      setTtsState((prev) => ({
        ...prev,
        status: 'playing',
        currentVerseIndex: index,
        currentVerseNumber: verse.number,
        rate: effectiveRate,
        selectedVoiceURI: effectiveVoiceURI,
      }));

      // Persist reading position
      saveStoredReadingPosition({
        bookId: data.bookId,
        chapterNumber: data.chapterNumber,
        verseNumber: verse.number,
      });

      ttsService.speakVerse(verse, {
        voiceURI: effectiveVoiceURI,
        rate: effectiveRate,
        onEnd: () => {
          speakVerseAtIndex(index + 1, { rate: effectiveRate, voiceURI: effectiveVoiceURI });
        },
        onError: (err) => {
          console.warn('TTS playback error:', err);
          setTtsState((prev) => ({ ...prev, status: 'idle', currentVerseNumber: null }));
        },
      });
    },
    [data.verses, data.bookId, data.chapterNumber, ttsState.rate, ttsState.selectedVoiceURI, onNextChapter]
  );

  // Play / Start Narrator
  const handlePlayTTS = () => {
    setIsNarratorOpen(true);
    if (ttsState.status === 'paused') {
      ttsService.resume();
      setTtsState((prev) => ({ ...prev, status: 'playing' }));
    } else {
      speakVerseAtIndex(ttsState.currentVerseIndex);
    }
  };

  const handlePauseTTS = () => {
    ttsService.pause();
    setTtsState((prev) => ({ ...prev, status: 'paused' }));
  };

  const handleStopTTS = () => {
    ttsService.cancel();
    setTtsState((prev) => ({
      ...prev,
      status: 'idle',
      currentVerseNumber: null,
    }));
  };

  const handleNextVerseTTS = () => {
    ttsService.cancel();
    speakVerseAtIndex(ttsState.currentVerseIndex + 1);
  };

  const handlePrevVerseTTS = () => {
    ttsService.cancel();
    speakVerseAtIndex(Math.max(0, ttsState.currentVerseIndex - 1));
  };

  const handleSetRateTTS = (newRate: number) => {
    setTtsState((prev) => ({ ...prev, rate: newRate }));
    saveStoredTTSSettings({
      rate: newRate,
      selectedVoiceURI: ttsState.selectedVoiceURI,
    });
    if (ttsState.status === 'playing') {
      ttsService.cancel();
      speakVerseAtIndex(ttsState.currentVerseIndex, { rate: newRate });
    }
  };

  const handleSetVoiceTTS = (voiceURI: string) => {
    setTtsState((prev) => ({ ...prev, selectedVoiceURI: voiceURI }));
    saveStoredTTSSettings({
      rate: ttsState.rate,
      selectedVoiceURI: voiceURI,
    });
    if (ttsState.status === 'playing') {
      ttsService.cancel();
      speakVerseAtIndex(ttsState.currentVerseIndex, { voiceURI });
    }
  };

  const handlePlayFromVerse = (verseNumber: string | number) => {
    const idx = data.verses.findIndex((v) => String(v.number) === String(verseNumber));
    if (idx !== -1) {
      setIsNarratorOpen(true);
      speakVerseAtIndex(idx);
    }
  };

  const handleToggleNarrator = () => {
    if (isNarratorOpen) {
      if (ttsState.status === 'playing') {
        handleStopTTS();
      }
      setIsNarratorOpen(false);
    } else {
      setIsNarratorOpen(true);
      handlePlayTTS();
    }
  };

  // Apply theme class and CSS properties to container
  const updateSettings = useCallback(
    (updates: Partial<ReaderSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates };
        saveStoredSettings(next);
        return next;
      });

      if (updates.theme && onThemeChange) {
        onThemeChange(updates.theme as ThemeMode);
      }
    },
    [onThemeChange]
  );

  // Handle Page Change notification and persistence
  const handlePageChange = useCallback(
    (page: number, total: number) => {
      setCurrentPage(page);
      setTotalPages(total);
      saveStoredReadingPosition({
        bookId: data.bookId,
        chapterNumber: data.chapterNumber,
        page: page,
      });
      if (onPageChange) {
        onPageChange(page, total);
      }
    },
    [data.bookId, data.chapterNumber, onPageChange]
  );

  // Handle Verse Selection from Canvas
  const handleSelectVerse = (verse: Verse) => {
    setSelectedVerse(verse);
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = (verseNumber: string | number) => {
    setBookmarkedVerses((prev) =>
      prev.includes(verseNumber)
        ? prev.filter((v) => v !== verseNumber)
        : [...prev, verseNumber]
    );
    if (onBookmarkVerse) {
      onBookmarkVerse(verseNumber);
    }
  };

  const themeClass =
    currentTheme === 'pergamino'
      ? 'theme-pergamino'
      : currentTheme === 'noche'
      ? 'theme-noche'
      : 'theme-sepia';

  return (
    <div
      ref={containerRef}
      id="alethia-reader-container"
      className={`relative min-h-[100dvh] flex flex-col w-full transition-colors duration-200 ${themeClass}`}
      style={{
        backgroundColor: 'var(--reader-bg)',
        color: 'var(--reader-text)',
      }}
    >
      {/* 1. Paper Grain Texture Overlay (Mitigates blue-light glare and screen hardness) */}
      <PaperGrainOverlay theme={currentTheme} />

      {/* 2. Zero-Flicker Software PWM Dimmer Overlay */}
      <PwmDimmerOverlay brightness={settings.softwareBrightness} />

      {/* 3. Header Toolbar (Collapsible via Zero-Distraction Immersive Mode / Middle Click) */}
      <ReaderToolbar
        settings={{ ...settings, theme: currentTheme }}
        onUpdateSettings={updateSettings}
        bookTitle={data.bookName}
        chapterNumber={data.chapterNumber}
        onNextChapter={onNextChapter}
        onPrevChapter={onPrevChapter}
        onOpenBookSelector={onOpenBookSelector}
        onOpenBookmarks={onOpenBookmarks}
        bookmarksCount={bookmarksCount}
        onToggleAudioNarrator={handleToggleNarrator}
        isAudioNarratorActive={isNarratorOpen}
      />

      {/* 4. Main Reading Canvas (Discrete Paginated Layout + Bimodal TTS Active Verse Highlight) */}
      <main
        className="flex-1 flex flex-col justify-start items-center w-full px-2 sm:px-6 relative overflow-hidden"
        style={{
          minHeight: 'calc(100dvh - 120px)',
        }}
      >
        <ReadingCanvas
          data={data}
          settings={{ ...settings, theme: currentTheme }}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onSelectVerse={handleSelectVerse}
          bookmarkedVerses={bookmarkedVerses}
          activeSpokenVerseNumber={ttsState.status === 'playing' || ttsState.status === 'paused' ? ttsState.currentVerseNumber : null}
          onNextChapter={onNextChapter}
          onPrevChapter={onPrevChapter}
          onToggleToolbar={() => updateSettings({ showToolbar: !settings.showToolbar })}
        />
      </main>

      {/* 5. Line Focus Overlay (Assists users with Dyslexia / ADHD) */}
      <LineFocusOverlay
        mode={settings.lineFocus}
        fontSize={settings.fontSize}
        lineHeight={settings.lineHeight}
      />

      {/* 6. Footer (Pagination + Integrated Ambient Progress & Audio Narrator Bar) */}
      <ReaderFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevPage={() => {
          if (currentPage > 1) {
            handlePageChange(currentPage - 1, totalPages);
          } else if (onPrevChapter) {
            onPrevChapter();
          }
        }}
        onNextPage={() => {
          if (currentPage < totalPages) {
            handlePageChange(currentPage + 1, totalPages);
          } else if (onNextChapter) {
            onNextChapter();
          }
        }}
        bookName={data.bookName}
        chapterNumber={data.chapterNumber}
        showControls={settings.showToolbar}
        isNarratorOpen={isNarratorOpen}
        ttsStatus={ttsState.status}
        currentVerseNumber={ttsState.currentVerseNumber}
        rate={ttsState.rate}
        availableVoices={availableVoices}
        selectedVoiceURI={ttsState.selectedVoiceURI}
        onPlayTTS={handlePlayTTS}
        onPauseTTS={handlePauseTTS}
        onStopTTS={handleStopTTS}
        onNextVerseTTS={handleNextVerseTTS}
        onPrevVerseTTS={handlePrevVerseTTS}
        onSetRateTTS={handleSetRateTTS}
        onSetVoiceTTS={handleSetVoiceTTS}
        onCloseNarrator={handleToggleNarrator}
      />

      {/* 7. Interactive Verse Action Modal (Bottom Sheet on Mobile / Centered on Desktop) */}
      <VerseModal
        isOpen={selectedVerse !== null}
        onClose={() => setSelectedVerse(null)}
        verse={selectedVerse}
        bookName={data.bookName}
        chapterNumber={data.chapterNumber}
        footnotes={data.footnotes || []}
        isBookmarked={
          selectedVerse !== null && bookmarkedVerses.includes(selectedVerse.number)
        }
        onToggleBookmark={(vNum) => {
          handleToggleBookmark(vNum);
        }}
        onPlayFromVerse={(vNum) => {
          handlePlayFromVerse(vNum);
          setSelectedVerse(null);
        }}
      />
    </div>
  );
};
