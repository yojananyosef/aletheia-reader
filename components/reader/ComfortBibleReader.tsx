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
  BookmarkRef,
} from '@/types/bible';
import { ReaderToolbar } from './ReaderToolbar';
import { ReaderFooter } from './ReaderFooter';
import { ReadingCanvas } from './ReadingCanvas';
import { PaperGrainOverlay } from './PaperGrainOverlay';
import { PwmDimmerOverlay } from './PwmDimmerOverlay';
import { LineFocusOverlay } from './LineFocusOverlay';
import { VerseModal } from './VerseModal';
import { ttsService } from '@/lib/tts-service';
import { wakeLockService } from '@/lib/wake-lock-service';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredTTSSettings,
  saveStoredTTSSettings,
  getStoredBookmarks,
  saveStoredReadingPosition,
} from '@/lib/storage-service';

export const ComfortBibleReader: React.FC<ComfortBibleReaderProps> = ({
  data,
  readerTarget,
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

  // --- Pagination State ---
  // Page 1 is the default; precise jumps to a verse's page are handled by
  // ReadingCanvas via the scrollToVerse prop (no heuristic needed here).
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // --- Bookmarking & Verse Interaction State ---
  // Bookmarks are identified by (bookId, chapter, verse) to avoid marking
  // equal verse numbers across different books/chapters.
  const [bookmarkedVerses, setBookmarkedVerses] = useState<BookmarkRef[]>(() =>
    getStoredBookmarks().map((b) => ({
      bookId: b.bookId,
      chapter: b.chapter,
      verse: b.verse,
    }))
  );
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

  // Cuando el narrador retrocede más allá del primer versículo, se cruza al
  // capítulo anterior y debe continuar desde su último versículo al cargarse.
  const pendingTTSLastVerseRef = useRef<boolean>(false);

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

  // Set up Media Session callbacks for lock screen / notification controls
  useEffect(() => {
    ttsService.setMediaSessionCallbacks(
      handlePrevVerseTTS,
      handleNextVerseTTS
    );
  });

  // Reset page and TTS on chapter change
  const currentChapterKey = `${data.bookId}-${data.chapterNumber}`;
  const prevChapterKeyRef = useRef(currentChapterKey);

  useEffect(() => {
    if (prevChapterKeyRef.current !== currentChapterKey) {
      prevChapterKeyRef.current = currentChapterKey;

      // The starting page (1, or the requested verse's exact page) is reported
      // by ReadingCanvas, which knows the real pagination. No page reset here.

      // Stop and reset TTS
      ttsService.cancel();
      wakeLockService.release();
      setTtsState((prev) => ({
        ...prev,
        status: 'idle',
        currentVerseIndex: 0,
        currentVerseNumber: null,
      }));
    }

    return () => {
      ttsService.cancel();
      wakeLockService.release();
    };
  }, [currentChapterKey, data.verses]);

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

      // Acquire wake lock to keep screen on during TTS
      wakeLockService.request();

      ttsService.speakVerse(verse, {
        voiceURI: effectiveVoiceURI,
        rate: effectiveRate,
        bookName: data.bookName,
        chapterNumber: data.chapterNumber,
        onEnd: () => {
          speakVerseAtIndex(index + 1, { rate: effectiveRate, voiceURI: effectiveVoiceURI });
        },
        onError: (err) => {
          console.warn('TTS playback error:', err);
          wakeLockService.release();
          setTtsState((prev) => ({ ...prev, status: 'idle', currentVerseNumber: null }));
        },
      });
    },
    [data.verses, data.bookId, data.chapterNumber, ttsState.rate, ttsState.selectedVoiceURI, onNextChapter]
  );

  // Narración retroactiva tipo libro: al cruzar hacia atrás al capítulo
  // anterior, continúa locutando desde su último versículo una vez cargado.
  useEffect(() => {
    if (!pendingTTSLastVerseRef.current) return;
    if (!data.verses || data.verses.length === 0) return;
    pendingTTSLastVerseRef.current = false;
    speakVerseAtIndex(data.verses.length - 1);
  }, [data.bookId, data.chapterNumber, data.verses, speakVerseAtIndex]);

  // Play / Start Narrator
  const handlePlayTTS = () => {
    setIsNarratorOpen(true);
    speakVerseAtIndex(ttsState.currentVerseIndex);
  };

  const handleStopTTS = () => {
    ttsService.cancel();
    wakeLockService.release();
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
    if (ttsState.currentVerseIndex <= 0) {
      if (ttsState.status === 'idle') {
        // Narrador detenido: comenzar desde el primer versículo.
        speakVerseAtIndex(0);
        return;
      }
      // Cruce hacia atrás: ir al capítulo anterior y, al cargarse, continuar
      // narrando desde su último versículo (página final, imitando un libro).
      if (onPrevChapter) {
        setTtsState((prev) => ({
          ...prev,
          status: 'idle',
          currentVerseIndex: 0,
          currentVerseNumber: null,
        }));
        onPrevChapter();
        pendingTTSLastVerseRef.current = true;
      }
    } else {
      speakVerseAtIndex(ttsState.currentVerseIndex - 1);
    }
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

  // Handle Bookmark Toggle (identity = bookId + chapter + verse)
  const handleToggleBookmark = (verseNumber: string | number) => {
    const ref: BookmarkRef = {
      bookId: data.bookId,
      chapter: data.chapterNumber,
      verse: verseNumber,
    };
    setBookmarkedVerses((prev) =>
      prev.some(
        (b) =>
          b.bookId === ref.bookId &&
          b.chapter === ref.chapter &&
          String(b.verse) === String(ref.verse)
      )
        ? prev.filter(
            (b) =>
              !(
                b.bookId === ref.bookId &&
                b.chapter === ref.chapter &&
                String(b.verse) === String(ref.verse)
              )
          )
        : [...prev, ref]
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
      className={`relative h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between w-full transition-colors duration-200 ${themeClass}`}
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
      <main className="flex-1 flex flex-col justify-start items-center w-full px-2 sm:px-6 relative overflow-hidden min-h-0">
        <ReadingCanvas
          data={data}
          settings={{ ...settings, theme: currentTheme }}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onSelectVerse={handleSelectVerse}
          bookmarkedVerses={bookmarkedVerses}
          readerTarget={readerTarget}
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
        onSwipePrev={() => {
          if (currentPage > 1) {
            handlePageChange(currentPage - 1, totalPages);
          } else if (onPrevChapter) {
            onPrevChapter();
          }
        }}
        onSwipeNext={() => {
          if (currentPage < totalPages) {
            handlePageChange(currentPage + 1, totalPages);
          } else if (onNextChapter) {
            onNextChapter();
          }
        }}
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
          selectedVerse !== null &&
          bookmarkedVerses.some(
            (b) =>
              b.bookId === data.bookId &&
              b.chapter === data.chapterNumber &&
              String(b.verse) === String(selectedVerse.number)
          )
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
