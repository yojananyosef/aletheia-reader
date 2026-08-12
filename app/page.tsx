'use client';

import React, { useState } from 'react';
import { SAMPLE_CHAPTERS } from '@/lib/sample-biblical-data';
import { ComfortBibleReader } from '@/components/reader/ComfortBibleReader';
import { BookOpen, BookmarkCheck, ChevronDown } from 'lucide-react';

export default function Home() {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [initialVerse, setInitialVerse] = useState<number | undefined>(undefined);
  const [bookmarksList, setBookmarksList] = useState<{ book: string; chapter: number; verse: number }[]>([]);
  const [showChapterSelector, setShowChapterSelector] = useState(false);

  const currentChapter = SAMPLE_CHAPTERS[currentChapterIndex] || SAMPLE_CHAPTERS[0];

  const handlePageChange = () => {
    // Page change callback hook
  };

  const handleBookmarkVerse = (verseNumber: number) => {
    setBookmarksList((prev) => {
      const exists = prev.some(
        (b) =>
          b.book === currentChapter.bookName &&
          b.chapter === currentChapter.chapterNumber &&
          b.verse === verseNumber
      );
      if (exists) {
        return prev.filter(
          (b) =>
            !(
              b.book === currentChapter.bookName &&
              b.chapter === currentChapter.chapterNumber &&
              b.verse === verseNumber
            )
        );
      }
      return [
        ...prev,
        {
          book: currentChapter.bookName,
          chapter: currentChapter.chapterNumber,
          verse: verseNumber,
        },
      ];
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Top Quick Chapter Switcher Bar */}
      <nav
        aria-label="Selección de pasaje bíblico"
        className="w-full flex items-center justify-between px-4 py-2 border-b text-xs select-none backdrop-blur-xs"
        style={{
          backgroundColor: 'var(--reader-bg, #FDFBF6)',
          borderColor: 'var(--reader-border, rgba(0,0,0,0.1))',
          color: 'var(--reader-text, #222222)',
        }}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          <span className="font-bold tracking-wide uppercase">Alethia Reader</span>
        </div>

        {/* Chapter Selection Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowChapterSelector(!showChapterSelector)}
              className="flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1 font-semibold text-xs transition-colors hover:bg-neutral-500/10 active:scale-95"
              style={{ borderColor: 'var(--reader-border, rgba(0,0,0,0.15))' }}
              aria-expanded={showChapterSelector}
              aria-label="Seleccionar libro y capítulo"
            >
              <span>{currentChapter.bookName} {currentChapter.chapterNumber}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {showChapterSelector && (
              <div
                className="absolute right-0 mt-1 w-56 rounded-xl border shadow-xl z-50 overflow-hidden"
                style={{
                  backgroundColor: 'var(--reader-bg, #FDFBF6)',
                  borderColor: 'var(--reader-border, rgba(0,0,0,0.15))',
                  color: 'var(--reader-text, #222222)',
                }}
              >
                <div className="p-2 border-b text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ borderColor: 'var(--reader-border)' }}>
                  Pasajes de Muestra
                </div>
                {SAMPLE_CHAPTERS.map((chap, idx) => (
                  <button
                    key={`${chap.bookId}-${chap.chapterNumber}`}
                    type="button"
                    onClick={() => {
                      setCurrentChapterIndex(idx);
                      setInitialVerse(undefined);
                      setShowChapterSelector(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${currentChapterIndex === idx
                        ? 'bg-amber-600/15 font-bold text-amber-800 dark:text-amber-300'
                        : 'hover:bg-neutral-500/10'
                      }`}
                  >
                    <span>{chap.bookName} {chap.chapterNumber}</span>
                    <span className="text-[10px] opacity-60">{chap.verses.length} versículos</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bookmarks Counter Indicator */}
          {bookmarksList.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium opacity-80 pl-2">
              <BookmarkCheck className="h-3.5 w-3.5 text-amber-600" />
              <span>{bookmarksList.length} guardado(s)</span>
            </div>
          )}
        </div>
      </nav>

      {/* Main ComfortBibleReader Component */}
      <ComfortBibleReader
        data={currentChapter}
        initialVerse={initialVerse}
        onPageChange={handlePageChange}
        onBookmarkVerse={handleBookmarkVerse}
      />
    </div>
  );
}
