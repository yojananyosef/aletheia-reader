'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ComfortBibleReaderProps,
  ReaderSettings,
  Verse,
  ThemeMode,
} from '@/types/bible';
import { ReaderToolbar } from './ReaderToolbar';
import { ReaderFooter } from './ReaderFooter';
import { ReadingCanvas } from './ReadingCanvas';
import { PaperGrainOverlay } from './PaperGrainOverlay';
import { PwmDimmerOverlay } from './PwmDimmerOverlay';
import { LineFocusOverlay } from './LineFocusOverlay';
import { VerseModal } from './VerseModal';

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

  const containerRef = useRef<HTMLDivElement>(null);

  // Apply theme class and CSS properties to container
  const updateSettings = useCallback((updates: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      return next;
    });

    if (updates.theme && onThemeChange) {
      onThemeChange(updates.theme as ThemeMode);
    }
  }, [onThemeChange]);

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
        />
      )}

      {/* 5. Discrete Horizontal Pagination Reading Canvas */}
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
        />
      </main>

      {/* 6. Discrete Reading Progress Footer (Shows only slim progress bar in immersive mode) */}
      <ReaderFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevPage={handleFooterPrev}
        onNextPage={handleFooterNext}
        bookName={data.bookName}
        chapterNumber={data.chapterNumber}
        totalWords={totalWords}
        showControls={settings.showToolbar}
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
      />
    </div>
  );
};

export default ComfortBibleReader;
