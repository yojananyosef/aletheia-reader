'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ComfortBibleReaderProps,
  ReaderSettings,
  Verse,
  ThemeMode,
  TTSVoiceOption,
  TTSState,
  BookmarkRef,
  TranslationId,
} from '@/types/bible';
import { ReaderToolbar } from './ReaderToolbar';
import { ReaderFooter } from './ReaderFooter';
import { ReadingCanvas } from './ReadingCanvas';
import { PaperGrainOverlay } from './PaperGrainOverlay';
import { PwmDimmerOverlay } from './PwmDimmerOverlay';
import { LineFocusOverlay } from './LineFocusOverlay';
import { VerseModal } from './VerseModal';
import { ttsService, ttsErrorMessage } from '@/lib/tts-service';
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
  selectedVersionId,
  onSelectVersion,
}) => {
  // --- Core Reader Settings (Restored from LocalStorage) ---
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const stored = getStoredSettings();
    return { ...stored, theme: theme || stored.theme };
  });

  // Notify parent of stored theme on mount (settings/TTS states already lazy-init from storage above)
  useEffect(() => {
    const stored = getStoredSettings();
    if (stored.theme && onThemeChange && stored.theme !== theme) {
      onThemeChange(stored.theme);
    }
    // Mount-only parent sync by design; storage must not re-read on prop changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effective active theme (prop takes precedence if provided)
  const currentTheme: ThemeMode = theme || settings.theme;

  // Mirror theme to <body> so body-portalled tooltips inherit --reader-* vars
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.remove('theme-pergamino', 'theme-noche', 'theme-sepia');
    document.body.classList.add(
      currentTheme === 'noche' ? 'theme-noche' : currentTheme === 'sepia' ? 'theme-sepia' : 'theme-pergamino'
    );
  }, [currentTheme]);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Track paginated page layout for split verse TTS synchronization
  const [paginatedPages, setPaginatedPages] = useState<(Verse & { _continuation?: boolean })[][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingTTSLastVerseRef = useRef<boolean>(false);

  // --- Bookmarking & Verse Interaction State ---
  const [bookmarkedVerses, setBookmarkedVerses] = useState<BookmarkRef[]>(() =>
    getStoredBookmarks().map((b) => ({
      bookId: b.bookId,
      chapter: b.chapter,
      verse: b.verse,
      versionId: b.versionId,
    }))
  );
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

  // --- Audio Narrator (TTS Bimodal) State ---
  const [isNarratorOpen, setIsNarratorOpen] = useState<boolean>(false);
  const [kokoroLoading, setKokoroLoading] = useState<boolean>(false);
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

  // Handle Page Change notification and persistence
  const handlePageChange = useCallback(
    (page: number, total: number) => {
      setCurrentPage(page);
      setTotalPages(total);
      saveStoredReadingPosition({
        bookId: data.bookId,
        chapterNumber: data.chapterNumber,
        page: page,
        versionId: data.versionId,
      });
      if (onPageChange) {
        onPageChange(page, total);
      }
    },
    [data.bookId, data.chapterNumber, data.versionId, onPageChange]
  );

  // State and Playback Nonce Refs to guarantee 0 race conditions and stable callback closures
  const activePlaybackIdRef = useRef<number>(0);
  const currentPageRef = useRef<number>(currentPage);
  const totalPagesRef = useRef<number>(totalPages);
  const paginatedPagesRef = useRef(paginatedPages);
  const ttsStateRef = useRef(ttsState);

  useEffect(() => {
    currentPageRef.current = currentPage;
    totalPagesRef.current = totalPages;
    paginatedPagesRef.current = paginatedPages;
    ttsStateRef.current = ttsState;
  });

  // Function to speak verse at specific index (Full natural verse utterance with stable closure)
  const speakVerseAtIndex = useCallback(
    (index: number, optionsOverride?: { rate?: number; voiceURI?: string | null }) => {
      if (!data.verses || data.verses.length === 0) return;

      const playbackId = ++activePlaybackIdRef.current;

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
      const effectiveRate =
        optionsOverride?.rate !== undefined ? optionsOverride.rate : ttsStateRef.current.rate;
      const effectiveVoiceURI =
        optionsOverride?.voiceURI !== undefined
          ? optionsOverride.voiceURI
          : ttsStateRef.current.selectedVoiceURI;

      setTtsState((prev) => ({
        ...prev,
        status: 'playing',
        currentVerseIndex: index,
        currentVerseNumber: verse.number,
        rate: effectiveRate,
        selectedVoiceURI: effectiveVoiceURI,
      }));

      // Find the first page containing this verse in paginatedPages
      const currentPages = paginatedPagesRef.current;
      const targetPageIndex = currentPages.findIndex((page) =>
        page.some((v) => String(v.number) === String(verse.number))
      );

      if (targetPageIndex !== -1) {
        const targetPage = targetPageIndex + 1;
        if (currentPageRef.current !== targetPage) {
          handlePageChange(targetPage, totalPagesRef.current);
        }
      }

      saveStoredReadingPosition({
        bookId: data.bookId,
        chapterNumber: data.chapterNumber,
        verseNumber: verse.number,
        versionId: data.versionId,
      });

      wakeLockService.request();

      ttsService.speakVerse(verse, {
        voiceURI: effectiveVoiceURI,
        rate: effectiveRate,
        bookName: data.bookName,
        chapterNumber: data.chapterNumber,
        onBoundary: (charIndex) => {
          if (activePlaybackIdRef.current !== playbackId) return;
          const pgs = paginatedPagesRef.current;
          let acc = 0;
          for (let p = 0; p < pgs.length; p++) {
            const vFrag = pgs[p].find((v) => String(v.number) === String(verse.number));
            if (vFrag) {
              const fragLen = (vFrag.text || '').length;
              if (charIndex >= acc && charIndex < acc + fragLen) {
                const targetPg = p + 1;
                if (currentPageRef.current !== targetPg) {
                  handlePageChange(targetPg, totalPagesRef.current);
                }
                break;
              }
              acc += fragLen;
            }
          }
        },
        onEnd: () => {
          if (activePlaybackIdRef.current !== playbackId) return;
          // eslint-disable-next-line react-hooks/immutability -- intentional recursion: self-call executes after init, chains verses
          speakVerseAtIndex(index + 1, { rate: effectiveRate, voiceURI: effectiveVoiceURI });
        },
        onError: (err) => {
          if (activePlaybackIdRef.current !== playbackId) return;
          // Log once, but don't spam sudo pacman — fallback to English is already attempted
          console.warn('TTS playback error:', ttsErrorMessage(err));
          wakeLockService.release();
          setTtsState((prev) => ({ ...prev, status: 'idle', currentVerseNumber: null }));
        },
      });
    },
    [data.verses, data.bookId, data.chapterNumber, data.bookName, data.versionId, handlePageChange, onNextChapter]
  );

  // Load Spanish voices on mount + Kokoro loading feedback
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

    const onKokoro = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setKokoroLoading(!!detail);
      if (detail) {
        setTtsState((prev) => ({ ...prev, status: 'playing' as const, currentVerseNumber: prev.currentVerseNumber }));
      }
    };
    window.addEventListener('kokoro-loading', onKokoro as EventListener);
    return () => window.removeEventListener('kokoro-loading', onKokoro as EventListener);
  }, [ttsState.selectedVoiceURI]);

  // Reset page and TTS on chapter change
  const currentChapterKey = `${data.bookId}-${data.chapterNumber}`;
  const prevChapterKeyRef = useRef(currentChapterKey);

  useEffect(() => {
    if (prevChapterKeyRef.current !== currentChapterKey) {
      prevChapterKeyRef.current = currentChapterKey;
      activePlaybackIdRef.current++;

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
      // eslint-disable-next-line react-hooks/exhaustive-deps -- nonce must observe latest playback; copying would miss in-flight races
      activePlaybackIdRef.current++;
      ttsService.cancel();
      wakeLockService.release();
    };
  }, [currentChapterKey]);

  // Retroactive TTS backwards chapter navigation
  useEffect(() => {
    if (!pendingTTSLastVerseRef.current) return;
    if (!data.verses || data.verses.length === 0) return;
    pendingTTSLastVerseRef.current = false;
    speakVerseAtIndex(data.verses.length - 1);
  }, [data.verses, speakVerseAtIndex]);

  // Play / Start Narrator
  const handlePlayTTS = () => {
    setIsNarratorOpen(true);
    const currentPageVerses = paginatedPagesRef.current[currentPageRef.current - 1] || [];
    const firstVerseOnPage = currentPageVerses[0]?.number;
    const startIdx =
      firstVerseOnPage !== undefined
        ? data.verses.findIndex((v) => String(v.number) === String(firstVerseOnPage))
        : ttsStateRef.current.currentVerseIndex;
    speakVerseAtIndex(startIdx !== -1 ? startIdx : 0);
  };

  const handleStopTTS = () => {
    activePlaybackIdRef.current++;
    ttsService.cancel();
    wakeLockService.release();
    setTtsState((prev) => ({
      ...prev,
      status: 'idle',
      currentVerseNumber: null,
    }));
  };

  const handleNextVerseTTS = () => {
    activePlaybackIdRef.current++;
    ttsService.cancel();
    speakVerseAtIndex(ttsStateRef.current.currentVerseIndex + 1);
  };

  const handlePrevVerseTTS = () => {
    activePlaybackIdRef.current++;
    ttsService.cancel();
    if (ttsStateRef.current.currentVerseIndex <= 0) {
      if (ttsStateRef.current.status === 'idle') {
        speakVerseAtIndex(0);
        return;
      }
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
      speakVerseAtIndex(ttsStateRef.current.currentVerseIndex - 1);
    }
  };

  // Set up Media Session callbacks
  useEffect(() => {
    ttsService.setMediaSessionCallbacks(
      handlePrevVerseTTS,
      handleNextVerseTTS
    );
  });

  const handleSetRateTTS = (newRate: number) => {
    setTtsState((prev) => ({ ...prev, rate: newRate }));
    saveStoredTTSSettings({
      rate: newRate,
      selectedVoiceURI: ttsStateRef.current.selectedVoiceURI,
    });
    if (ttsStateRef.current.status === 'playing') {
      speakVerseAtIndex(ttsStateRef.current.currentVerseIndex, { rate: newRate });
    }
  };

  const handleSetVoiceTTS = (voiceURI: string) => {
    setTtsState((prev) => ({ ...prev, selectedVoiceURI: voiceURI }));
    saveStoredTTSSettings({
      rate: ttsStateRef.current.rate,
      selectedVoiceURI: voiceURI,
    });
    if (ttsStateRef.current.status === 'playing') {
      speakVerseAtIndex(ttsStateRef.current.currentVerseIndex, { voiceURI });
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
      if (ttsStateRef.current.status === 'playing') {
        handleStopTTS();
      }
      setIsNarratorOpen(false);
    } else {
      setIsNarratorOpen(true);
      handlePlayTTS();
    }
  };

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

  const handleToggleBookmark = (verseNumber: string | number) => {
    const ref: BookmarkRef = {
      bookId: data.bookId,
      chapter: data.chapterNumber,
      verse: verseNumber,
      versionId: data.versionId as TranslationId,
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

  const handlePagesComputed = useCallback((newPages: (Verse & { _continuation?: boolean })[][]) => {
    setPaginatedPages((prev) => {
      if (prev === newPages) return prev;
      if (prev.length === newPages.length) {
        let isIdentical = true;
        for (let i = 0; i < prev.length; i++) {
          if (prev[i].length !== newPages[i].length) {
            isIdentical = false;
            break;
          }
          for (let j = 0; j < prev[i].length; j++) {
            if (
              prev[i][j].number !== newPages[i][j].number ||
              prev[i][j].text !== newPages[i][j].text ||
              prev[i][j]._continuation !== newPages[i][j]._continuation
            ) {
              isIdentical = false;
              break;
            }
          }
          if (!isIdentical) break;
        }
        if (isIdentical) return prev;
      }
      return newPages;
    });
  }, []);

  const mergedSettings = useMemo<ReaderSettings>(
    () => ({
      ...settings,
      theme: currentTheme,
    }),
    [settings, currentTheme]
  );

  const totalChapterWords = useMemo(
    () =>
      (data.verses ?? []).reduce(
        (acc, v) => acc + (v.text ? v.text.split(/\s+/).filter(Boolean).length : 0),
        0
      ),
    [data.verses]
  );

  const themeClass =
    currentTheme === 'pergamino'
      ? 'theme-pergamino'
      : currentTheme === 'noche'
      ? 'theme-noche'
      : 'theme-sepia';

  return (
    <div
      ref={containerRef}
      id="aletheia-reader-container"
      className={`relative h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between w-full transition-colors duration-200 ${themeClass}`}
      style={{
        backgroundColor: 'var(--reader-bg)',
        color: 'var(--reader-text)',
      }}
    >
      <PaperGrainOverlay theme={currentTheme} />
      <PwmDimmerOverlay brightness={settings.softwareBrightness} />

      <ReaderToolbar
        settings={mergedSettings}
        onUpdateSettings={updateSettings}
        onOpenBookSelector={onOpenBookSelector}
        onOpenBookmarks={onOpenBookmarks}
        bookmarksCount={bookmarksCount}
        onToggleAudioNarrator={handleToggleNarrator}
        isAudioNarratorActive={isNarratorOpen}
        selectedVersionId={selectedVersionId}
        onSelectVersion={onSelectVersion}
      />

      <main className="flex-1 flex flex-col justify-start items-center w-full px-2 sm:px-6 relative overflow-hidden min-h-0">
        <ReadingCanvas
          data={data}
          settings={mergedSettings}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onSelectVerse={setSelectedVerse}
          bookmarkedVerses={bookmarkedVerses}
          readerTarget={readerTarget}
          activeSpokenVerseNumber={ttsState.status === 'playing' || ttsState.status === 'paused' ? ttsState.currentVerseNumber : null}
          onNextChapter={onNextChapter}
          onPrevChapter={onPrevChapter}
          onToggleToolbar={() => updateSettings({ showToolbar: !settings.showToolbar })}
          onPagesComputed={handlePagesComputed}
        />
      </main>

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

      {kokoroLoading && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs font-medium px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          Cargando voz... Por favor espera.
        </div>
      )}

      <ReaderFooter
        currentPage={currentPage}
        totalPages={totalPages}
        bookName={data.bookName}
        chapterNumber={data.chapterNumber}
        totalWords={totalChapterWords}
        showControls={settings.showToolbar}
        isNarratorOpen={isNarratorOpen}
        ttsStatus={kokoroLoading ? 'playing' : ttsState.status}
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
