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
  // --- Core Reader Settings ---
  const [settings, setSettings] = useState<ReaderSettings>({
    theme: theme,
    font: 'bookerly',
    fontSize: 18,
    lineHeight: 1.6,
    softwareBrightness: 1.0,
    lineFocus: 'off',
    showToolbar: true,
    fontWeight: 400,
  });

  // Effective active theme (prop takes precedence if provided)
  const currentTheme: ThemeMode = theme || settings.theme;

  // Calculate initial page based on initialVerse if provided
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
  const [ttsState, setTtsState] = useState<TTSState>({
    status: 'idle',
    currentVerseIndex: 0,
    currentVerseNumber: null,
    rate: 1.0,
    selectedVoiceURI: null,
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
    [data.verses, ttsState.rate, ttsState.selectedVoiceURI, totalPages, onNextChapter]
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
    if (ttsState.status === 'playing') {
      ttsService.cancel();
      speakVerseAtIndex(ttsState.currentVerseIndex, { rate: newRate });
    }
  };

  const handleSetVoiceTTS = (voiceURI: string) => {
    setTtsState((prev) => ({ ...prev, selectedVoiceURI: voiceURI }));
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
        return next;
      });

      if (updates.theme && onThemeChange) {
        onThemeChange(updates.theme as ThemeMode);
      }
    },
    [onThemeChange]
  );

  // Handle Page Change notification
  const handlePageChange = useCallback(
    (page: number, total: number) => {
      setCurrentPage(page);
      setTotalPages(total);
      if (onPageChange) {
        onPageChange(page, total);
      }
    },
    [onPageChange]
  );

  // Handle Verse Bookmarking
  const handleToggleBookmark = useCallback(
    (verseNumber: string | number) => {
      setBookmarkedVerses((prev) => {
        const exists = prev.some((v) => String(v) === String(verseNumber));
        const next = exists
          ? prev.filter((v) => String(v) !== String(verseNumber))
          : [...prev, verseNumber];
        return next;
      });

      if (onBookmarkVerse) {
        onBookmarkVerse(verseNumber);
      }
    },
    [onBookmarkVerse]
  );

  // Reset page when chapter data changes
  const prevChapterKey = useRef(`${data.bookId}-${data.chapterNumber}`);
  useEffect(() => {
    const key = `${data.bookId}-${data.chapterNumber}`;
    if (prevChapterKey.current !== key) {
      prevChapterKey.current = key;
      setCurrentPage(getInitialPage());
    }
  }, [data.bookId, data.chapterNumber, getInitialPage]);

  // Handle Footer Prev/Next with chapter transition support
  const handleFooterPrev = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (onPrevChapter) {
      onPrevChapter();
    }
  };

  const handleFooterNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    } else if (onNextChapter) {
      onNextChapter();
    }
  };

  // Compute total approximate words for reading time
  const totalWords = React.useMemo(() => {
    return data.verses.reduce((acc, v) => acc + v.text.split(/\s+/).length, 0);
  }, [data.verses]);

  // Active settings with synced theme
  const activeSettings = {
    ...settings,
    theme: currentTheme,
  };

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen w-full flex-col overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: 'var(--reader-bg)',
        color: 'var(--reader-text)',
      }}
    >
      {/* 1. Procedural SVG Paper Texture Overlay */}
      <PaperGrainOverlay theme={currentTheme} />

      {/* 2. GPU Software Dimmer (PWM Flicker Mitigation) */}
      <PwmDimmerOverlay brightness={settings.softwareBrightness} />

      {/* 3. Line Focus Aperture (ADHD & Cognitive Accessibility) */}
      <LineFocusOverlay
        mode={settings.lineFocus}
        fontSize={settings.fontSize}
        lineHeight={settings.lineHeight}
      />

      {/* 4. Accessible Unified Toolbar / HUD */}
      {settings.showToolbar && (
        <ReaderToolbar
          settings={activeSettings}
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
      )}

      {/* 5. Discrete Horizontal Pagination Reading Canvas with TTS Highlighting */}
      <main className="relative flex flex-1 flex-col justify-center items-center overflow-hidden">
        <ReadingCanvas
          data={data}
          settings={activeSettings}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onSelectVerse={(verse) => setSelectedVerse(verse)}
          bookmarkedVerses={bookmarkedVerses}
          onToggleToolbar={() => updateSettings({ showToolbar: !settings.showToolbar })}
          onNextChapter={onNextChapter}
          onPrevChapter={onPrevChapter}
          activeSpokenVerseNumber={ttsState.currentVerseNumber}
        />
      </main>

      {/* 6. Cohesive Reading Progress & Audio Narrator Footer */}
      <ReaderFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevPage={handleFooterPrev}
        onNextPage={handleFooterNext}
        bookName={data.bookName}
        chapterNumber={data.chapterNumber}
        totalWords={totalWords}
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
        onCloseNarrator={() => {
          handleStopTTS();
          setIsNarratorOpen(false);
        }}
      />

      {/* 7. Non-invasive Verse Details & Footnotes Modal */}
      <VerseModal
        isOpen={!!selectedVerse}
        onClose={() => setSelectedVerse(null)}
        verse={selectedVerse}
        bookName={data.bookName}
        chapterNumber={data.chapterNumber}
        footnotes={data.footnotes || []}
        isBookmarked={
          selectedVerse
            ? bookmarkedVerses.some((bv) => String(bv) === String(selectedVerse.number))
            : false
        }
        onToggleBookmark={handleToggleBookmark}
        onPlayFromVerse={handlePlayFromVerse}
      />
    </div>
  );
};

export default ComfortBibleReader;
