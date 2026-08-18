'use client';

import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
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

let measureContainer: HTMLDivElement | null = null;

function getMeasureContainer(
  containerWidth: number,
  fontSize: number,
  lineHeight: number,
  fontWeight: number,
  letterSpacing: number,
  fontFamily: string,
): HTMLDivElement {
  if (typeof document === 'undefined') {
    throw new Error('DOM measurement is only available on client');
  }

  if (!measureContainer || !measureContainer.isConnected) {
    measureContainer = document.createElement('div');
    measureContainer.setAttribute('aria-hidden', 'true');
    measureContainer.style.cssText = `
      position: absolute;
      top: -99999px;
      left: -99999px;
      visibility: hidden;
      pointer-events: none;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      text-align: left;
    `;
    document.body.appendChild(measureContainer);
  }

  measureContainer.style.width = `${containerWidth}px`;
  measureContainer.style.maxWidth = '60ch';
  measureContainer.style.fontSize = `${fontSize}px`;
  measureContainer.style.lineHeight = `${lineHeight}`;
  measureContainer.style.fontWeight = `${fontWeight}`;
  measureContainer.style.letterSpacing = `${letterSpacing}em`;
  measureContainer.style.fontFamily = fontFamily;

  return measureContainer;
}

function renderVerseHtmlForMeasurement(
  verse: Verse & { _continuation?: boolean },
  isFirstVerseOnPage: boolean,
  isFirstPage: boolean,
  sections?: { beforeVerse: string | number; title: string }[],
  settings?: ReaderSettings,
): string {
  const section = sections?.find((sec) => String(sec.beforeVerse) === String(verse.number));
  const continued = !!verse._continuation;

  let sectionHtml = '';
  if (section && !continued) {
    const headingClass =
      isFirstVerseOnPage && isFirstPage
        ? 'font-sans font-bold text-xs sm:text-base my-2 sm:my-2.5 opacity-80'
        : 'font-sans font-bold text-sm sm:text-lg my-3 sm:my-4 pt-1 opacity-90';
    sectionHtml = `<h3 class="${headingClass}" style="display:block;margin-top:0.6rem;margin-bottom:0.4rem;font-weight:bold;">${section.title}</h3>`;
  }

  let text = verse.text;
  if (settings?.bionicReading) {
    text = applyBionicReading(text);
  }
  if (settings?.phoneticDots) {
    text = applySyllablePoints(text);
  }

  const superHtml = !continued
    ? `<span class="verse-super" style="font-size:0.72em;vertical-align:super;font-weight:700;margin-right:0.3em;margin-left:0.15em;display:inline;">${verse.number}</span>`
    : '';

  return `${sectionHtml}<span class="inline" style="display:inline;">${superHtml}<span>${text}</span> </span>`;
}

function measurePageHeight(
  verses: (Verse & { _continuation?: boolean })[],
  isFirstPage: boolean,
  containerWidth: number,
  settings: ReaderSettings,
  sections?: { beforeVerse: string | number; title: string }[],
): number {
  if (verses.length === 0) return 0;

  const fontFamily =
    settings.font === 'bookerly'
      ? 'var(--font-serif-bookerly, "Literata", "Lora", serif)'
      : settings.font === 'atkinson'
      ? 'var(--font-sans-atkinson, "Atkinson Hyperlegible", sans-serif)'
      : 'var(--font-dyslexic-main, "OpenDyslexic", sans-serif)';

  const container = getMeasureContainer(
    containerWidth,
    settings.fontSize,
    settings.lineHeight,
    settings.fontWeight,
    settings.letterSpacing ?? 0.02,
    fontFamily,
  );

  const html = verses
    .map((v, idx) => renderVerseHtmlForMeasurement(v, idx === 0, isFirstPage, sections, settings))
    .join('');

  container.innerHTML = html;
  return container.scrollHeight;
}

function buildPagination(
  verses: Verse[],
  availableHeight: number,
  containerWidth: number,
  settings: ReaderSettings,
  sections?: { beforeVerse: string | number; title: string }[],
): PaginationResult {
  if (verses.length === 0 || availableHeight <= 0 || containerWidth <= 0) {
    return { pages: [verses] };
  }

  const MAX_WORDS = 70;
  // Safety buffer to prevent sub-pixel antialiasing/wrapping errors from causing 1px overflow
  const safetyBuffer = Math.min(16, Math.max(8, settings.fontSize * 0.4));
  const effectiveAvailableHeight = Math.max(60, availableHeight - safetyBuffer);

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

  const queue: { number: string | number; text: string; _continuation?: boolean }[] =
    verses.map(v => ({ number: v.number, text: v.text }));

  const pages: (Verse & { _continuation?: boolean })[][] = [];
  let currentPageVerses: (Verse & { _continuation?: boolean })[] = [];
  let currentWordsOnPage = 0;

  while (queue.length > 0) {
    const item = queue.shift()!;
    const itemWords = countWords(item.text);
    const isFirstPage = pages.length === 0;

    // Check if adding the whole verse fits on the current page
    const candidatePage = [...currentPageVerses, item];
    const candidateWords = currentWordsOnPage + itemWords;
    const candidateHeight = measurePageHeight(candidatePage, isFirstPage, containerWidth, settings, sections);

    if (candidateHeight <= effectiveAvailableHeight && (currentPageVerses.length === 0 || candidateWords <= MAX_WORDS)) {
      currentPageVerses.push(item);
      currentWordsOnPage += itemWords;
      continue;
    }

    // Verse does not fit completely on current page.
    // Try to binary search the max number of words from `item` that fit on this page.
    let low = 1;
    let high = itemWords - 1;
    let bestFitWords = 0;

    if (currentPageVerses.length > 0) {
      const remainingWordsAllowed = MAX_WORDS - currentWordsOnPage;
      if (remainingWordsAllowed < high) {
        high = Math.max(0, remainingWordsAllowed);
      }
    }

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const [firstPart] = splitAtWord(item.text, mid);
      const testItem = { number: item.number, text: firstPart, _continuation: item._continuation };
      const testPage = [...currentPageVerses, testItem];
      const testHeight = measurePageHeight(testPage, isFirstPage, containerWidth, settings, sections);

      if (testHeight <= effectiveAvailableHeight) {
        bestFitWords = mid;
        low = mid + 1; // Try fitting more words
      } else {
        high = mid - 1; // Too tall, try fewer words
      }
    }

    if (bestFitWords > 0) {
      const [firstPart, restPart] = splitAtWord(item.text, bestFitWords);
      currentPageVerses.push({ number: item.number, text: firstPart, _continuation: item._continuation });

      pages.push(currentPageVerses);
      currentPageVerses = [];
      currentWordsOnPage = 0;

      if (restPart.length > 0) {
        queue.unshift({ number: item.number, text: restPart, _continuation: true });
      }
    } else {
      // 0 words fit on this page
      if (currentPageVerses.length > 0) {
        // Close current page and retry on a fresh page
        pages.push(currentPageVerses);
        currentPageVerses = [];
        currentWordsOnPage = 0;
        queue.unshift(item);
      } else {
        // Extreme edge case: empty page and even 1 word exceeded height. Place 1 word to avoid infinite loop.
        const [firstPart, restPart] = splitAtWord(item.text, 1);
        pages.push([{ number: item.number, text: firstPart, _continuation: item._continuation }]);
        if (restPart.length > 0) {
          queue.unshift({ number: item.number, text: restPart, _continuation: true });
        }
      }
    }
  }

  if (currentPageVerses.length > 0) {
    pages.push(currentPageVerses);
  }

  return { pages: pages.length > 0 ? pages : [verses] };
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
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pagination, setPagination] = useState<PaginationResult | null>(null);

  // Compute available dimensions directly from DOM
  const getAvailableDimensions = useCallback(() => {
    const vh = window.visualViewport?.height || window.innerHeight;
    const vw = window.visualViewport?.width || window.innerWidth;
    const isMobile = vw < 640;

    const containerEl = containerRef.current;
    const headerEl = headerRef.current;

    let availableHeight: number;
    let availableWidth: number;

    if (containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(containerEl);
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

      let headerH = isMobile ? 70 : 88;
      if (headerEl) {
        const headerRect = headerEl.getBoundingClientRect();
        const headerStyle = window.getComputedStyle(headerEl);
        const headerMarginBottom = parseFloat(headerStyle.marginBottom) || 0;
        headerH = headerRect.height + headerMarginBottom;
      }

      availableHeight = containerRect.height - paddingTop - paddingBottom - headerH;

      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      availableWidth = containerRect.width - paddingLeft - paddingRight;
    } else {
      // Precise fallback if DOM container is not yet mounted/laid out
      const toolbarHeight = settings.showToolbar ? (isMobile ? 48 : 52) : 0;
      const footerHeight = settings.showToolbar ? (isMobile ? 68 : 56) : (isMobile ? 28 : 24);
      const canvasPadding = isMobile ? 24 : 44;
      const headerTotal = isMobile ? 70 : 88;
      availableHeight = vh - toolbarHeight - footerHeight - canvasPadding - headerTotal;
      availableWidth = vw - (isMobile ? 28 : 64);
    }

    return {
      availableHeight: Math.max(0, availableHeight),
      availableWidth: Math.max(0, availableWidth),
    };
  }, [settings.showToolbar]);

  const recomputePagination = useCallback(() => {
    if (!data.verses || data.verses.length === 0) {
      setPagination(null);
      return;
    }

    const { availableHeight, availableWidth } = getAvailableDimensions();

    if (availableHeight <= 0 || availableWidth <= 0) {
      setPagination(null);
      return;
    }

    const result = buildPagination(
      data.verses,
      availableHeight,
      availableWidth,
      settings,
      data.sections,
    );

    setPagination(result);
  }, [
    data.verses,
    data.sections,
    getAvailableDimensions,
    settings,
  ]);

  // Build pages whenever data, settings, or dimensions change
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      recomputePagination();
    });
    return () => cancelAnimationFrame(rafId);
  }, [
    data.bookId,
    data.chapterNumber,
    data.verses,
    data.sections,
    settings.fontSize,
    settings.lineHeight,
    settings.fontWeight,
    settings.letterSpacing,
    settings.font,
    settings.bionicReading,
    settings.phoneticDots,
    settings.showToolbar,
    recomputePagination,
  ]);

  // Observe container size changes (e.g. toolbar toggle animation, rotation, window resize)
  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl || typeof ResizeObserver === 'undefined') return;

    let rafId: number;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        recomputePagination();
      });
    });

    observer.observe(containerEl);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [recomputePagination]);

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
          ref={headerRef}
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
