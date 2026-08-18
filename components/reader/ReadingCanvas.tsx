'use client';

import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { ChapterPayload, Verse, ReaderSettings, BookmarkRef, ReaderTarget } from '@/types/bible';
import { Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { applyBionicReading, applySyllablePoints } from '@/lib/text-transforms';

interface ReadingCanvasProps {
  data: ChapterPayload;
  settings: ReaderSettings;
  currentPage: number;
  onPageChange: (page: number, totalPages: number) => void;
  onSelectVerse: (verse: Verse) => void;
  bookmarkedVerses: BookmarkRef[];
  readerTarget?: ReaderTarget | null;
  onToggleToolbar: () => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  activeSpokenVerseNumber?: string | number | null;
}

interface PaginationResult {
  pages: (Verse & { _continuation?: boolean })[][];
}

function buildPagination(
  verses: Verse[],
  availableHeight: number,
  containerWidth: number,
  fontSize: number,
  lineHeight: number,
  fontWeight: number,
  letterSpacing: number,
): PaginationResult {
  const MAX_WORDS = 50;

  if (verses.length === 0 || availableHeight <= 0 || containerWidth <= 0) {
    return { pages: [verses] };
  }

  const measureHeight = (text: string): number => {
    const m = document.createElement('div');
    m.style.cssText = `
      visibility:hidden;position:absolute;top:0;left:0;
      width:${containerWidth}px;max-width:60ch;
      font-size:${fontSize}px;line-height:${lineHeight};
      font-weight:${fontWeight};letter-spacing:${letterSpacing}em;
      box-sizing:border-box;padding:0;margin:0;text-align:left;
    `;
    m.textContent = text;
    document.body.appendChild(m);
    const h = m.scrollHeight;
    document.body.removeChild(m);
    return h;
  };

  const countWords = (text: string): number => text.split(/\s+/).filter(Boolean).length;

  const splitAtWord = (text: string, maxWords: number): [string, string] => {
    const words = text.split(/(\s+)/);
    let count = 0;
    let splitIdx = 0;
    for (let i = 0; i < words.length; i += 2) {
      count++;
      if (count > maxWords) {
        splitIdx = words.slice(0, i).join('').length;
        break;
      }
    }
    if (splitIdx === 0) splitIdx = text.length;
    return [text.slice(0, splitIdx), text.slice(splitIdx).trimStart()];
  };

  // Phase 1: Build pages using queue-based approach
  const result: (Verse & { _continuation?: boolean })[][] = [[]];
  let curPage = 0;
  let curHeight = 0;
  let curWords = 0;

  const startNewPage = () => {
    result.push([]);
    curPage++;
    curHeight = 0;
    curWords = 0;
  };

  const queue: { number: string | number; text: string; _continuation?: boolean }[] =
    verses.map(v => ({ number: v.number, text: v.text }));

  while (queue.length > 0) {
    const item = queue.shift()!;
    const itemWords = countWords(item.text);
    const itemHeight = measureHeight(item.text);

    // Fits on current page
    if (curHeight + itemHeight <= availableHeight && curWords + itemWords <= MAX_WORDS) {
      result[curPage].push(item);
      curHeight += itemHeight;
      curWords += itemWords;
      continue;
    }

    // Empty page — must place something
    if (result[curPage].length === 0) {
      if (itemWords > MAX_WORDS) {
        const [first, rest] = splitAtWord(item.text, MAX_WORDS);
        result[curPage].push({ number: item.number, text: first, _continuation: item._continuation });
        curHeight = measureHeight(first);
        curWords = countWords(first);
        if (rest.length > 0) queue.unshift({ number: item.number, text: rest, _continuation: true });
      } else if (itemHeight > availableHeight) {
        const fitWords = Math.max(3, Math.min(itemWords - 1, Math.floor(itemWords * 0.7)));
        const [firstPart, restPart] = splitAtWord(item.text, fitWords);
        result[curPage].push({ number: item.number, text: firstPart, _continuation: item._continuation });
        curHeight = measureHeight(firstPart);
        curWords = countWords(firstPart);
        if (restPart.length > 0) queue.unshift({ number: item.number, text: restPart, _continuation: true });
      } else {
        result[curPage].push(item);
        curHeight = itemHeight;
        curWords = itemWords;
      }
      continue;
    }

    // Page has content — try to split verse to fill remaining space
    const remainingWords = MAX_WORDS - curWords;
    const remainingHeight = availableHeight - curHeight;

    if (remainingWords > 5 && itemWords > remainingWords) {
      const [first, rest] = splitAtWord(item.text, remainingWords);
      const firstH = measureHeight(first);
      if (curHeight + firstH <= availableHeight) {
        result[curPage].push({ number: item.number, text: first, _continuation: item._continuation });
        curHeight += firstH;
        curWords += countWords(first);
        if (rest.length > 0) queue.unshift({ number: item.number, text: rest, _continuation: true });
        continue;
      }
    }

    if (itemHeight > remainingHeight && remainingHeight > 20) {
      const fitWords = Math.max(3, Math.min(itemWords - 1, Math.floor(itemWords * (remainingHeight / itemHeight) * 0.8)));
      const [first, rest] = splitAtWord(item.text, fitWords);
      const firstH = measureHeight(first);
      if (curHeight + firstH <= availableHeight && rest.length > 0) {
        result[curPage].push({ number: item.number, text: first, _continuation: item._continuation });
        curHeight += firstH;
        curWords += countWords(first);
        queue.unshift({ number: item.number, text: rest, _continuation: true });
        continue;
      }
    }

    // Can't fit — new page
    startNewPage();
    queue.unshift(item);
  }

  const pages = result.filter(p => p.length > 0);

  // Phase 2: Post-verify — split any pages that still overflow
  for (let iter = 0; iter < 5; iter++) {
    let fixed = false;
    for (let pi = 0; pi < pages.length; pi++) {
      const pageText = pages[pi].map(v => v.text).join(' ');
      const h = measureHeight(pageText);
      if (h <= availableHeight) continue;

      const last = pages[pi][pages[pi].length - 1];
      const lastWords = countWords(last.text);
      if (lastWords <= 3) continue; // can't split further

      const fitWords = Math.max(3, Math.floor(lastWords * (availableHeight / h) * 0.75));
      const [first, rest] = splitAtWord(last.text, fitWords);
      if (rest.length > 0 && countWords(first) > 0) {
        pages[pi][pages[pi].length - 1] = { number: last.number, text: first };
        pages.splice(pi + 1, 0, [{ number: last.number, text: rest }]);
        fixed = true;
      }
    }
    if (!fixed) break;
  }

  return { pages };
}

export const ReadingCanvas: React.FC<ReadingCanvasProps> = ({
  data,
  settings,
  currentPage,
  onPageChange,
  onSelectVerse,
  bookmarkedVerses,
  readerTarget,
  onToggleToolbar,
  onNextChapter,
  onPrevChapter,
  activeSpokenVerseNumber,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pagination, setPagination] = useState<PaginationResult | null>(null);

  // Compute available dimensions
  const getAvailableDimensions = () => {
    const vh = window.visualViewport?.height || window.innerHeight;
    const vw = window.visualViewport?.width || window.innerWidth;
    const isMobile = vw < 640;
    const headerDeduction = isMobile ? 130 : 140;
    const availableHeight = vh - headerDeduction;

    // Get container width for text measurement
    const containerEl = containerRef.current;
    const contentEl = contentRef.current;
    const availableWidth = (contentEl?.clientWidth || containerEl?.clientWidth || vw - (isMobile ? 24 : 56));

    return { availableHeight, availableWidth };
  };

  // Build pages whenever data or settings change
  useEffect(() => {
    if (!data.verses || data.verses.length === 0) {
      setPagination(null);
      return;
    }

    const rafId = requestAnimationFrame(() => {
      const { availableHeight, availableWidth } = getAvailableDimensions();

      if (availableHeight <= 0 || availableWidth <= 0) {
        setPagination(null);
        return;
      }

      const result = buildPagination(
        data.verses,
        availableHeight,
        availableWidth,
        settings.fontSize,
        settings.lineHeight,
        settings.fontWeight,
        settings.letterSpacing ?? 0.02,
      );

      setPagination(result);
    });

    return () => cancelAnimationFrame(rafId);
  }, [
    data.bookId,
    data.chapterNumber,
    data.verses,
    settings.fontSize,
    settings.lineHeight,
    settings.fontWeight,
    settings.letterSpacing,
    settings.showToolbar,
  ]);

  const pages = pagination?.pages || [data.verses || []] as (Verse & { _continuation?: boolean })[][];
  const totalPages = pages.length;

  // --- Authoritative page control ---
  const chapterKeyRef = useRef<string>(`${data.bookId}-${data.chapterNumber}`);
  const totalPagesRef = useRef<number | null>(null);
  const consumedScrollRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const chapterKey = `${data.bookId}-${data.chapterNumber}`;
    const chapterChanged = chapterKeyRef.current !== chapterKey;
    const totalChanged = totalPagesRef.current !== totalPages;
    const targetMatches =
      readerTarget !== null &&
      readerTarget !== undefined &&
      readerTarget.bookId === data.bookId &&
      readerTarget.chapter === data.chapterNumber;
    const targetKey = targetMatches
      ? readerTarget.kind === 'verse'
        ? `v:${readerTarget.bookId}:${readerTarget.chapter}:${String(readerTarget.verse)}:${readerTarget.requestId}`
        : `l:${readerTarget.bookId}:${readerTarget.chapter}:${readerTarget.requestId}`
      : null;
    const targetVerse =
      targetMatches && readerTarget.kind === 'verse' ? readerTarget.verse : null;

    if (targetKey === null) {
      consumedScrollRef.current = null;
      if (!chapterChanged && !totalChanged) return;
    }

    if (chapterChanged) chapterKeyRef.current = chapterKey;
    if (totalChanged) totalPagesRef.current = totalPages;

    let nextPage: number | null = null;

    if (chapterChanged) {
      if (targetVerse !== null) {
        const idx = pages.findIndex((page) =>
          page.some((v) => String(v.number) === String(targetVerse))
        );
        nextPage = idx !== -1 ? idx + 1 : 1;
        if (idx !== -1) consumedScrollRef.current = targetKey;
      } else if (targetKey !== null) {
        nextPage = Math.max(1, totalPages);
        consumedScrollRef.current = targetKey;
      } else {
        nextPage = 1;
      }
    } else if (targetKey !== null && targetKey !== consumedScrollRef.current) {
      if (targetVerse !== null) {
        const idx = pages.findIndex((page) =>
          page.some((v) => String(v.number) === String(targetVerse))
        );
        if (idx !== -1) {
          nextPage = idx + 1;
          consumedScrollRef.current = targetKey;
        }
      } else {
        nextPage = Math.max(1, totalPages);
        consumedScrollRef.current = targetKey;
      }
    } else if (totalChanged) {
      nextPage = Math.min(currentPage, Math.max(1, totalPages));
    }

    if (nextPage !== null && (nextPage !== currentPage || chapterChanged || totalChanged)) {
      onPageChange(nextPage, totalPages);
    }
  }, [readerTarget, pages, totalPages, currentPage, onPageChange, data.bookId, data.chapterNumber]);

  // TTS page sync
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

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35 && deltaTime < 600) {
      if (deltaX < 0) {
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1, totalPages);
        } else if (onNextChapter) {
          onNextChapter();
        }
      } else {
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

  // Keyboard navigation
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

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1, totalPages);
        } else if (nextChapterRef.current) {
          nextChapterRef.current();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
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

  // Click Navigation Zones
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
  const activeVerses = useMemo(() => pages[currentPage - 1] || [], [pages, currentPage]);

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

      {/* Discrete Page Content Block */}
      <div
        className="w-full max-w-[60ch] flex-1 flex flex-col justify-start text-left"
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          fontWeight: settings.fontWeight,
          letterSpacing: `${settings.letterSpacing ?? 0.02}em`,
        }}
      >
        {/* Fixed Height Header Container */}
        <div
          className="w-full h-[58px] sm:h-[68px] mb-3 sm:mb-5 flex flex-col justify-end border-b pb-2 select-none transition-colors"
          style={{ borderColor: 'var(--reader-border)' }}
        >
          {currentPage === 1 ? (
            <div className="flex flex-col justify-end">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-widest opacity-60 font-semibold block font-sans leading-none mb-1">
                {data.bookName}
              </span>
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight leading-none" style={{ color: 'var(--reader-text)' }}>
                Capítulo {data.chapterNumber}
              </h2>
            </div>
          ) : (
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
            <div
              ref={contentRef}
              className="m-0 p-0 text-left"
              style={{
                lineHeight: settings.lineHeight,
                letterSpacing: `${settings.letterSpacing ?? 0.02}em`,
              }}
            >
              {activeVerses.map((verse, idx) => {
                const isBookmarked = bookmarkedVerses.some(
                  (bv) =>
                    bv.bookId === data.bookId &&
                    bv.chapter === data.chapterNumber &&
                    String(bv.verse) === String(verse.number)
                );
                const isSpoken =
                  activeSpokenVerseNumber !== null &&
                  activeSpokenVerseNumber !== undefined &&
                  String(activeSpokenVerseNumber) === String(verse.number);

                const section = data.sections?.find(
                  (sec) => String(sec.beforeVerse) === String(verse.number)
                );

                const verseFootnotes = (data.footnotes || []).filter((fn) => {
                  const fnRef = String(fn.verseNumber).trim();
                  const vNum = String(verse.number).trim();
                  return fnRef === vNum || vNum.split('-').includes(fnRef);
                });

                const continued = !!verse._continuation;

                return (
                  <React.Fragment key={`${verse.number}-${currentPage}-${idx}`}>
                    {section && !continued && (
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
                      {!continued && (
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
                      )}

                      <span
                        onClick={(e) => {
                          if (window.getSelection()?.toString().length === 0) {
                            e.stopPropagation();
                            onSelectVerse(verse);
                          }
                        }}
                        className="cursor-pointer hover:bg-neutral-500/5 rounded px-0.5 transition-colors"
                        title="Clic para opciones del versículo"
                        dangerouslySetInnerHTML={{
                          __html: (() => {
                            let text = verse.text;
                            if (settings.bionicReading) {
                              text = applyBionicReading(text);
                            }
                            if (settings.phoneticDots) {
                              text = applySyllablePoints(text);
                            }
                            return text;
                          })(),
                        }}
                      />

                      {!continued && verseFootnotes.map((fn) => (
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
