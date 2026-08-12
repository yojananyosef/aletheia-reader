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
  bookmarkedVerses: (string | number)[];
  onToggleToolbar: () => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  activeSpokenVerseNumber?: string | number | null;
}

export const ReadingCanvas: React.FC<ReadingCanvasProps> = ({
  data,
  settings,
  currentPage,
  onPageChange,
  onSelectVerse,
  bookmarkedVerses,
  onToggleToolbar,
  onNextChapter,
  onPrevChapter,
  activeSpokenVerseNumber,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportDimensions, setViewportDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  });

  // Track window & container resize dynamically
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewportDimensions({
          width: rect.width || window.innerWidth,
          height: rect.height || (window.visualViewport?.height || window.innerHeight),
        });
      } else {
        setViewportDimensions({
          width: window.innerWidth,
          height: window.visualViewport?.height || window.innerHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  // Compute pages dynamically based on viewport width, height, font size, and text length
  const pages = useMemo<Verse[][]>(() => {
    if (!data.verses || data.verses.length === 0) return [[]];

    const isMobile = viewportDimensions.width < 640;
    const isTablet = viewportDimensions.width >= 640 && viewportDimensions.width < 1024;

    // 1. Calculate actual available width for text
    const horizontalPadding = isMobile ? 24 : isTablet ? 40 : 56;
    const availableWidthPx = Math.max(260, viewportDimensions.width - horizontalPadding);
    
    // Average character width for typical serif/sans fonts (em proportion)
    const charWidthPx = settings.fontSize * 0.46;
    // Dynamic CPL (Characters Per Line) adapted to screen size
    const effectiveCPL = Math.max(24, Math.min(62, Math.floor(availableWidthPx / charWidthPx)));

    // 2. Calculate effective reading height (discounting fixed header & footer clearance)
    const headerHeight = settings.showToolbar ? (isMobile ? 48 : 54) : 0;
    const footerHeight = settings.showToolbar ? (isMobile ? 60 : 66) : 20;
    const canvasPaddings = isMobile ? 54 : 76;
    const verticalDeductionPx = headerHeight + footerHeight + canvasPaddings;
    const effectiveHeightPx = Math.max(170, viewportDimensions.height - verticalDeductionPx);
    const linePx = settings.fontSize * settings.lineHeight;
    const linesPerPage = Math.max(3, Math.floor(effectiveHeightPx / linePx));

    // Base character capacity for standard page
    const baseCharsPerPage = linesPerPage * effectiveCPL;

    // 3. Page partition algorithm with safe headroom
    const resultPages: Verse[][] = [];
    let currentPageVerses: Verse[] = [];
    let currentChars = 0;

    for (let i = 0; i < data.verses.length; i++) {
      const verse = data.verses[i];
      const isFirstPage = resultPages.length === 0;

      // Page 1 has the larger chapter title (deduct approx 1.5 lines of capacity)
      const pageCapacity = isFirstPage
        ? Math.floor(baseCharsPerPage * 0.80)
        : Math.floor(baseCharsPerPage * 0.94); // 6% safety margin against word-wrap overflow

      // Check if this verse has a section heading before it
      const hasSection = data.sections?.some(
        (sec) => String(sec.beforeVerse) === String(verse.number)
      );
      const sectionExtraChars = hasSection ? Math.floor(effectiveCPL * 1.0) : 0;
      const verseChars = verse.text.length + 8 + sectionExtraChars;

      if (currentChars + verseChars > pageCapacity && currentPageVerses.length > 0) {
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
  }, [
    data.verses,
    data.sections,
    viewportDimensions.width,
    viewportDimensions.height,
    settings.fontSize,
    settings.lineHeight,
    settings.showToolbar,
  ]);

  const totalPages = pages.length;

  // Sync total pages with parent
  useEffect(() => {
    onPageChange(Math.min(currentPage, Math.max(1, totalPages)), totalPages);
  }, [totalPages, currentPage, onPageChange]);

  // Sincronización determinista de página basada en la ubicación exacta del versículo que se está leyendo
  useEffect(() => {
    if (activeSpokenVerseNumber === null || activeSpokenVerseNumber === undefined || pages.length === 0) return;
    const targetPageIndex = pages.findIndex((page) =>
      page.some((v) => String(v.number) === String(activeSpokenVerseNumber))
    );
    if (targetPageIndex !== -1) {
      const targetPage = targetPageIndex + 1;
      if (targetPage !== currentPage) {
        onPageChange(targetPage, pages.length);
      }
    }
  }, [activeSpokenVerseNumber, pages, currentPage, onPageChange]);

  // Touch Swipe Gesture Detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;

    // Fast flick or clear horizontal swipe (> 35px in under 500ms)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35 && deltaTime < 600) {
      if (deltaX < 0) {
        // Swiped Left -> Next Page / Next Chapter
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1, totalPages);
        } else if (onNextChapter) {
          onNextChapter();
        }
      } else {
        // Swiped Right -> Prev Page / Prev Chapter
        if (currentPage > 1) {
          onPageChange(currentPage - 1, totalPages);
        } else if (onPrevChapter) {
          onPrevChapter();
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation (SC 2.1.1 Keyboard Accessible)
  const nextChapterRef = useRef(onNextChapter);
  const prevChapterRef = useRef(onPrevChapter);
  useEffect(() => {
    nextChapterRef.current = onNextChapter;
    prevChapterRef.current = onPrevChapter;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1, totalPages);
        } else if (nextChapterRef.current) {
          nextChapterRef.current();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        if (currentPage > 1) {
          onPageChange(currentPage - 1, totalPages);
        } else if (prevChapterRef.current) {
          prevChapterRef.current();
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

    const leftThreshold = width * 0.28;
    const rightThreshold = width * 0.72;

    if (clickX < leftThreshold) {
      if (currentPage > 1) {
        onPageChange(currentPage - 1, totalPages);
      } else if (onPrevChapter) {
        onPrevChapter();
      }
    } else if (clickX > rightThreshold) {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1, totalPages);
      } else if (onNextChapter) {
        onNextChapter();
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
      className={`eink-discrete-page-container relative flex-1 flex flex-col justify-start items-center w-full px-3.5 sm:px-8 pt-4 sm:pt-7 pb-2 sm:pb-4 select-text transition-colors duration-200 cursor-default ${fontClass}`}
      style={{
        backgroundColor: 'var(--reader-bg)',
        color: 'var(--reader-text)',
      }}
    >
      {/* Screen reader announcement for page changes */}
      <div className="sr-only" aria-live="polite" role="status">
        {`${data.bookName} Capítulo ${data.chapterNumber}, Página ${currentPage} de ${totalPages}`}
      </div>

      {/* Discrete Page Content Block (Strictly 50-60 CPL max, left aligned, line-height 1.6, top-anchored) */}
      <div
        className="w-full max-w-[60ch] flex-1 flex flex-col justify-start text-left"
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          fontWeight: settings.fontWeight,
        }}
      >
        {/* Fixed Height Header Container (Guarantees zero layout shift on page flips) */}
        <div
          className="w-full h-[58px] sm:h-[68px] mb-3 sm:mb-5 flex flex-col justify-end border-b pb-2 select-none transition-colors"
          style={{ borderColor: 'var(--reader-border)' }}
        >
          {currentPage === 1 ? (
            /* Page 1 Chapter Heading */
            <div className="flex flex-col justify-end">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-widest opacity-60 font-semibold block font-sans leading-none mb-1">
                {data.bookName}
              </span>
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight leading-none" style={{ color: 'var(--reader-text)' }}>
                Capítulo {data.chapterNumber}
              </h2>
            </div>
          ) : (
            /* Pages 2+ Stable Running Head */
            <div className="w-full flex items-center justify-between opacity-50 text-xs font-semibold uppercase tracking-widest font-sans leading-none">
              <span className="truncate max-w-[200px]">{data.bookName} {data.chapterNumber}</span>
              <span className="text-[10px] font-mono shrink-0">Pág. {currentPage}/{totalPages}</span>
            </div>
          )}
        </div>

        {/* Page Content with smooth transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${data.bookId}-${data.chapterNumber}-${currentPage}`}
            initial={{ opacity: 0.35, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0.35, x: -6 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="flex-1"
          >
            {/* Continuous Biblical Paragraph Flow */}
            <div className="m-0 p-0 text-left leading-[1.6em] tracking-normal">
              {activeVerses.map((verse, idx) => {
                const isBookmarked = bookmarkedVerses.some(
                  (bv) => String(bv) === String(verse.number)
                );
                const isSpoken =
                  activeSpokenVerseNumber !== null &&
                  activeSpokenVerseNumber !== undefined &&
                  String(activeSpokenVerseNumber) === String(verse.number);

                // Check for section headings before this verse
                const section = data.sections?.find(
                  (sec) => String(sec.beforeVerse) === String(verse.number)
                );

                // Check for footnotes matching this verse
                const verseFootnotes = (data.footnotes || []).filter((fn) => {
                  const fnRef = String(fn.verseNumber).trim();
                  const vNum = String(verse.number).trim();
                  return fnRef === vNum || vNum.split('-').includes(fnRef);
                });

                return (
                  <React.Fragment key={String(verse.number)}>
                    {/* Section Subtitle / Perícope Heading */}
                    {section && (
                      <h3
                        className={`w-full font-bold tracking-tight opacity-90 block font-sans ${
                          idx === 0 && currentPage === 1
                            ? 'text-xs sm:text-base my-2 sm:my-2.5 opacity-80'
                            : 'text-sm sm:text-lg my-3 sm:my-4 pt-1 opacity-90'
                        }`}
                        style={{
                          color: 'var(--reader-text)',
                        }}
                      >
                        {section.title}
                      </h3>
                    )}

                    <span
                      className={`inline relative rounded-md transition-all ${
                        isSpoken
                          ? 'tts-active-verse'
                          : isBookmarked
                          ? 'bg-reader-accent-subtle'
                          : ''
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
                          <Bookmark className="inline h-2.5 w-2.5 ml-0.5 fill-current text-reader-accent" />
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

                      {/* Footnote Indicators */}
                      {verseFootnotes.map((fn) => (
                        <button
                          key={fn.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVerse(verse);
                          }}
                          className="footnote-indicator inline-flex items-center"
                          aria-label={`Nota al pie del versículo ${verse.number}: ${fn.note}`}
                          title={`Nota al pie: ${fn.note}`}
                        >
                          [{fn.marker || '*'}]
                        </button>
                      ))}
                      {' '}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
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
