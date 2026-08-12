'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChapterPayload, Verse, ReaderSettings } from '@/types/bible';
import { Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadingCanvasProps {
  data: ChapterPayload;
  settings: ReaderSettings;
  currentPage: number;
  onPageChange: (page: number, totalPages: number) => void;
  onSelectVerse: (verse: Verse) => void;
  bookmarkedVerses: number[];
  onToggleToolbar: () => void;
}

export const ReadingCanvas: React.FC<ReadingCanvasProps> = ({
  data,
  settings,
  currentPage,
  onPageChange,
  onSelectVerse,
  bookmarkedVerses,
  onToggleToolbar,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportDimensions, setViewportDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  // Track window resize to recompute pagination chunks
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewportDimensions({
          width: rect.width || window.innerWidth,
          height: rect.height || window.innerHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute pages dynamically based on viewport, font size, and text length
  const pages = useMemo<Verse[][]>(() => {
    if (!data.verses || data.verses.length === 0) return [[]];

    // Estimate characters/words capacity per page based on font size and height
    const effectiveHeight = Math.max(300, viewportDimensions.height - 180);
    const linePx = settings.fontSize * settings.lineHeight;
    const linesPerPage = Math.max(6, Math.floor(effectiveHeight / linePx));
    const charsPerPage = linesPerPage * 52;

    const resultPages: Verse[][] = [];
    let currentPageVerses: Verse[] = [];
    let currentChars = 0;

    for (let i = 0; i < data.verses.length; i++) {
      const verse = data.verses[i];
      const verseChars = verse.text.length + 15;

      if (currentChars + verseChars > charsPerPage && currentPageVerses.length > 0) {
        resultPages.push(currentPageVerses);
        currentPageVerses = [verse];
        currentChars = verseChars;
      } else {
        currentPageVerses.push(verse);
        currentChars += verseChars;
      }
    }

    if (currentPageVerses.length > 0) {
      resultPages.push(currentPageVerses);
    }

    return resultPages;
  }, [data.verses, viewportDimensions.height, settings.fontSize, settings.lineHeight]);

  const totalPages = pages.length;

  // Sync total pages with parent
  useEffect(() => {
    onPageChange(Math.min(currentPage, Math.max(1, totalPages)), totalPages);
  }, [totalPages, currentPage, onPageChange]);

  // Touch Swipe Gesture Detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Check if horizontal swipe exceeds vertical swipe and threshold
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        // Swiped Left -> Next Page
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1, totalPages);
        }
      } else {
        // Swiped Right -> Prev Page
        if (currentPage > 1) {
          onPageChange(currentPage - 1, totalPages);
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation (SC 2.1.1 Keyboard Accessible)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1, totalPages);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        if (currentPage > 1) {
          onPageChange(currentPage - 1, totalPages);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPageChange]);

  // Click Navigation Zones (Kindle standard: left 1/3 = prev, right 1/3 = next, middle = toggle toolbar)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.verse-super') || target.closest('.footnote-indicator')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    const leftThreshold = width * 0.3;
    const rightThreshold = width * 0.7;

    if (clickX < leftThreshold) {
      if (currentPage > 1) {
        onPageChange(currentPage - 1, totalPages);
      }
    } else if (clickX > rightThreshold) {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1, totalPages);
      }
    } else {
      onToggleToolbar();
    }
  };

  // Active page content
  const activeVerses = pages[currentPage - 1] || [];

  const fontClass =
    settings.font === 'bookerly'
      ? 'font-bookerly'
      : settings.font === 'atkinson'
      ? 'font-atkinson'
      : 'font-opendyslexic';

  return (
    <div
      ref={containerRef}
      onClick={handleCanvasClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`eink-discrete-page-container relative flex-1 flex flex-col justify-center items-center w-full px-4 sm:px-8 py-6 select-text transition-colors duration-200 cursor-default ${fontClass}`}
      style={{
        backgroundColor: 'var(--reader-bg)',
        color: 'var(--reader-text)',
      }}
    >
      {/* Screen reader announcement for page changes */}
      <div className="sr-only" aria-live="polite" role="status">
        {`${data.bookName} Capítulo ${data.chapterNumber}, Página ${currentPage} de ${totalPages}`}
      </div>

      {/* Discrete Page Content Block (Strictly 50-60 CPL, left aligned, line-height 1.6) */}
      <div
        className="w-full max-w-[60ch] flex-1 flex flex-col justify-start text-left"
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          fontWeight: settings.fontWeight,
          minHeight: '50vh',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${data.bookId}-${data.chapterNumber}-${currentPage}`}
            initial={{ opacity: 0.4, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0.4, x: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex-1"
          >
            {/* Chapter Header (Only on Page 1) */}
            {currentPage === 1 && (
              <header className="mb-6 border-b pb-4" style={{ borderColor: 'var(--reader-border)' }}>
                <span className="text-xs uppercase tracking-widest opacity-60 font-semibold block">
                  {data.bookName}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1" style={{ color: 'var(--reader-text)' }}>
                  Capítulo {data.chapterNumber}
                </h2>
              </header>
            )}

            {/* Continuous Biblical Paragraph Flow */}
            <p className="m-0 p-0 text-left leading-[1.6em] tracking-normal inline">
              {activeVerses.map((verse) => {
                const isBookmarked = bookmarkedVerses.includes(verse.number);
                const hasFootnote = data.footnotes?.some((fn) => fn.verseNumber === verse.number);

                return (
                  <span
                    key={verse.number}
                    className={`inline relative rounded-md transition-colors ${
                      isBookmarked ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    {/* Inline attenuated superscript verse number */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVerse(verse);
                      }}
                      className="verse-super inline-flex items-center"
                      aria-label={`Versículo ${verse.number}. Clic para ver opciones o notas`}
                      title={`Versículo ${verse.number}`}
                    >
                      {verse.number}
                      {isBookmarked && (
                        <Bookmark className="inline h-2.5 w-2.5 ml-0.5 fill-amber-600 text-amber-600" />
                      )}
                    </button>

                    {/* Verse Text Flow */}
                    <span
                      onClick={(e) => {
                        if (window.getSelection()?.toString().length === 0) {
                          e.stopPropagation();
                          onSelectVerse(verse);
                        }
                      }}
                      className="cursor-pointer hover:bg-neutral-500/5 rounded px-0.5 transition-colors"
                      title="Clic para opciones del versículo"
                    >
                      {verse.text}
                    </span>

                    {/* Footnote Indicator */}
                    {hasFootnote && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVerse(verse);
                        }}
                        className="footnote-indicator"
                        aria-label={`Nota al pie del versículo ${verse.number}`}
                        title="Ver nota al pie"
                      >
                        [*]
                      </button>
                    )}
                    {' '}
                  </span>
                );
              })}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Invisible Left and Right Tap Guides */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1/4 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-start pl-3"
      >
        <span className="text-xs font-mono font-medium opacity-20 hidden md:inline">
          ‹ Anterior
        </span>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1/4 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-end pr-3"
      >
        <span className="text-xs font-mono font-medium opacity-20 hidden md:inline">
          Siguiente ›
        </span>
      </div>
    </div>
  );
};
