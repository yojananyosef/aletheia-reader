'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BibleBookMeta, ChapterPayload, ThemeMode } from '@/types/bible';
import { getBibleBooks, getChapterData } from '@/lib/bible-service';
import { ComfortBibleReader } from '@/components/reader/ComfortBibleReader';
import {
  BookOpen,
  BookmarkCheck,
  Search,
  X,
  BookMarked,
  Loader2,
} from 'lucide-react';

export default function Home() {
  const [books, setBooks] = useState<BibleBookMeta[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('GEN');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [initialVerse, setInitialVerse] = useState<string | number | undefined>(undefined);
  const [chapterPayload, setChapterPayload] = useState<ChapterPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<ThemeMode>('pergamino');

  // Navigation Drawers
  const [showBookSelector, setShowBookSelector] = useState<boolean>(false);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState<boolean>(false);
  const [activeTestamentTab, setActiveTestamentTab] = useState<'AT' | 'NT'>('AT');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [browsingBook, setBrowsingBook] = useState<BibleBookMeta | null>(null);

  // Bookmarks List
  const [bookmarksList, setBookmarksList] = useState<
    { bookId: string; bookName: string; chapter: number; verse: string | number; text?: string }[]
  >([]);

  // Load Bible books catalog on mount
  useEffect(() => {
    let isMounted = true;
    getBibleBooks()
      .then((loadedBooks) => {
        if (!isMounted) return;
        setBooks(loadedBooks);
        if (loadedBooks.length > 0) {
          const firstBook = loadedBooks[0];
          setSelectedBookId(firstBook.id);
          setBrowsingBook(firstBook);
        }
      })
      .catch((err) => {
        console.error('Error cargando catálogo bíblico:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load chapter data when book or chapter changes
  useEffect(() => {
    let isMounted = true;

    async function fetchChapter() {
      try {
        const data = await getChapterData(selectedBookId, selectedChapter);
        if (isMounted && data) {
          setChapterPayload(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error cargando capítulo:', err);
          setLoading(false);
        }
      }
    }

    if (selectedBookId) {
      fetchChapter();
    }

    return () => {
      isMounted = false;
    };
  }, [selectedBookId, selectedChapter]);

  // Current Book Meta
  const currentBookMeta = useMemo(() => {
    return books.find((b) => b.id === selectedBookId) || books[0];
  }, [books, selectedBookId]);

  // Filtered books list
  const filteredBooks = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return books.filter(
        (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
      );
    }
    return books.filter((b) => b.testament === activeTestamentTab);
  }, [books, activeTestamentTab, searchQuery]);

  // Navigate to Next Chapter across books
  const handleNextChapter = () => {
    if (!currentBookMeta) return;

    if (selectedChapter < currentBookMeta.totalChapters) {
      setLoading(true);
      setSelectedChapter((prev) => prev + 1);
      setInitialVerse(undefined);
    } else {
      const currentIndex = books.findIndex((b) => b.id === selectedBookId);
      if (currentIndex !== -1 && currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        setLoading(true);
        setSelectedBookId(nextBook.id);
        setSelectedChapter(1);
        setInitialVerse(undefined);
      }
    }
  };

  // Navigate to Previous Chapter across books
  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setLoading(true);
      setSelectedChapter((prev) => prev - 1);
      setInitialVerse(undefined);
    } else {
      const currentIndex = books.findIndex((b) => b.id === selectedBookId);
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1];
        setLoading(true);
        setSelectedBookId(prevBook.id);
        setSelectedChapter(prevBook.totalChapters);
        setInitialVerse(undefined);
      }
    }
  };

  // Handle Verse Bookmarking
  const handleBookmarkVerse = (verseNumber: string | number) => {
    if (!chapterPayload) return;

    const verseObj = chapterPayload.verses.find((v) => String(v.number) === String(verseNumber));
    const verseText = verseObj?.text;

    setBookmarksList((prev) => {
      const exists = prev.some(
        (b) =>
          b.bookId === chapterPayload.bookId &&
          b.chapter === chapterPayload.chapterNumber &&
          String(b.verse) === String(verseNumber)
      );

      if (exists) {
        return prev.filter(
          (b) =>
            !(
              b.bookId === chapterPayload.bookId &&
              b.chapter === chapterPayload.chapterNumber &&
              String(b.verse) === String(verseNumber)
            )
        );
      }

      return [
        ...prev,
        {
          bookId: chapterPayload.bookId,
          bookName: chapterPayload.bookName,
          chapter: chapterPayload.chapterNumber,
          verse: verseNumber,
          text: verseText,
        },
      ];
    });
  };

  const themeClass =
    theme === 'pergamino'
      ? 'theme-pergamino'
      : theme === 'noche'
      ? 'theme-noche'
      : 'theme-sepia';

  return (
    <div
      className={`relative min-h-screen flex flex-col w-full transition-colors duration-200 ${themeClass}`}
      style={{
        backgroundColor: 'var(--reader-bg)',
        color: 'var(--reader-text)',
      }}
    >
      {/* Main ComfortBibleReader Component */}
      {loading && !chapterPayload ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3 min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-reader-accent" />
          <p className="text-sm font-medium opacity-70">Cargando Sagradas Escrituras...</p>
        </div>
      ) : chapterPayload ? (
        <ComfortBibleReader
          data={chapterPayload}
          initialVerse={initialVerse}
          theme={theme}
          onThemeChange={setTheme}
          onBookmarkVerse={handleBookmarkVerse}
          onNextChapter={handleNextChapter}
          onPrevChapter={handlePrevChapter}
          onOpenBookSelector={() => {
            setBrowsingBook(currentBookMeta || books[0]);
            setShowBookSelector(true);
          }}
          onOpenBookmarks={() => setShowBookmarksDrawer(true)}
          bookmarksCount={bookmarksList.length}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 min-h-screen">
          <p>No se pudo cargar el capítulo seleccionado.</p>
        </div>
      )}

      {/* Full Bible Book & Chapter Navigation Modal */}
      {showBookSelector && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Explorador de Libros y Capítulos de la Biblia"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-6 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowBookSelector(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-colors"
            style={{
              backgroundColor: 'var(--reader-bg)',
              borderColor: 'var(--reader-border)',
              color: 'var(--reader-text)',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--reader-border)' }}>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-reader-accent" />
                <h2 className="text-base sm:text-lg font-bold">Explorador Bíblico (66 Libros)</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowBookSelector(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-500/15"
                aria-label="Cerrar explorador"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search and Testament Tabs */}
            <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--reader-border)' }}>
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                <input
                  type="text"
                  placeholder="Buscar libro (ej. Génesis, Salmos, Mateo, Romanos)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm bg-transparent outline-none transition-all focus:ring-2 focus:ring-reader-accent"
                  style={{
                    borderColor: 'var(--reader-border)',
                    color: 'var(--reader-text)',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full hover:bg-neutral-500/20"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Testament Switcher Tabs (Only if not searching) */}
              {!searchQuery && (
                <div className="flex rounded-xl border p-1" style={{ borderColor: 'var(--reader-border)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTestamentTab('AT')}
                    className={`flex-1 min-h-[38px] rounded-lg text-xs font-bold transition-all ${
                      activeTestamentTab === 'AT'
                        ? 'bg-reader-accent shadow-xs'
                        : 'opacity-70 hover:bg-neutral-500/10'
                    }`}
                  >
                    Antiguo Testamento (39)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTestamentTab('NT')}
                    className={`flex-1 min-h-[38px] rounded-lg text-xs font-bold transition-all ${
                      activeTestamentTab === 'NT'
                        ? 'bg-reader-accent shadow-xs'
                        : 'opacity-70 hover:bg-neutral-500/10'
                    }`}
                  >
                    Nuevo Testamento (27)
                  </button>
                </div>
              )}
            </div>

            {/* Body: Two Column Browser (Left: Books List, Right: Chapters Grid) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[350px]">
              {/* Left: Books List */}
              <div className="md:col-span-6 border-r overflow-y-auto p-3 space-y-1 max-h-[50vh] md:max-h-none" style={{ borderColor: 'var(--reader-border)' }}>
                <div className="text-[11px] uppercase tracking-wider font-bold opacity-60 px-2 py-1">
                  {searchQuery ? `Resultados (${filteredBooks.length})` : activeTestamentTab === 'AT' ? 'Libros del Antiguo Testamento' : 'Libros del Nuevo Testamento'}
                </div>
                {filteredBooks.map((book) => {
                  const isSelected = browsingBook?.id === book.id;
                  const isCurrent = selectedBookId === book.id;

                  return (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => setBrowsingBook(book)}
                      className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-reader-accent font-bold shadow-xs'
                          : isCurrent
                          ? 'bg-reader-accent-subtle font-semibold'
                          : 'hover:bg-neutral-500/10 opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs opacity-75">{book.id}</span>
                        <span>{book.name}</span>
                      </div>
                      <span className="text-xs opacity-75">
                        {book.totalChapters} cap.
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right: Chapter Grid for the selected book */}
              <div className="md:col-span-6 overflow-y-auto p-4 flex flex-col max-h-[50vh] md:max-h-none">
                {browsingBook ? (
                  <>
                    <div className="border-b pb-3 mb-4 flex items-center justify-between" style={{ borderColor: 'var(--reader-border)' }}>
                      <div>
                        <h3 className="text-base font-bold">{browsingBook.name}</h3>
                        <p className="text-xs opacity-70">
                          Selecciona un capítulo ({browsingBook.totalChapters} disponibles)
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-reader-accent-subtle">
                        {browsingBook.testament === 'AT' ? 'Antiguo Testamento' : 'Nuevo Testamento'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {Array.from({ length: browsingBook.totalChapters }, (_, i) => i + 1).map((chapNum) => {
                        const isCurrentActive =
                          selectedBookId === browsingBook.id && selectedChapter === chapNum;

                        return (
                          <button
                            key={chapNum}
                            type="button"
                            onClick={() => {
                              setLoading(true);
                              setSelectedBookId(browsingBook.id);
                              setSelectedChapter(chapNum);
                              setInitialVerse(undefined);
                              setShowBookSelector(false);
                            }}
                            className={`flex min-h-[44px] items-center justify-center rounded-xl border text-sm font-bold transition-all active:scale-95 ${
                              isCurrentActive
                                ? 'bg-reader-accent border-reader-accent ring-2 ring-offset-2'
                                : 'hover:bg-neutral-500/10'
                            }`}
                            style={
                              !isCurrentActive
                                ? {
                                    borderColor: 'var(--reader-border)',
                                    color: 'var(--reader-text)',
                                  }
                                : {
                                    borderColor: 'var(--reader-accent)',
                                  }
                            }
                            title={`${browsingBook.name} Capítulo ${chapNum}`}
                          >
                            {chapNum}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm opacity-60">
                    Selecciona un libro para ver sus capítulos
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookmarks History Drawer */}
      {showBookmarksDrawer && (
        <div
          role="dialog"
          aria-label="Versículos Guardados"
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowBookmarksDrawer(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full overflow-y-auto border-l p-6 shadow-2xl transition-all animate-in slide-in-from-right duration-200 flex flex-col"
            style={{
              backgroundColor: 'var(--reader-bg)',
              borderColor: 'var(--reader-border)',
              color: 'var(--reader-text)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: 'var(--reader-border)' }}>
              <div className="flex items-center gap-2">
                <BookmarkCheck className="h-5 w-5 text-reader-accent" />
                <h2 className="text-lg font-bold">Versículos Guardados</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowBookmarksDrawer(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-500/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {bookmarksList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-60">
                <BookMarked className="h-12 w-12 text-reader-accent opacity-50" />
                <p className="text-sm">No has guardado versículos todavía.</p>
                <p className="text-xs">
                  Haz clic en cualquier número de versículo durante la lectura para guardarlo aquí.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3">
                {bookmarksList.map((bm, index) => (
                  <div
                    key={`${bm.bookId}-${bm.chapter}-${bm.verse}-${index}`}
                    className="rounded-xl border p-3 transition-all hover:bg-neutral-500/10 flex flex-col gap-2"
                    style={{ borderColor: 'var(--reader-border)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-reader-accent">
                        {bm.bookName} {bm.chapter}:{bm.verse}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setLoading(true);
                          setSelectedBookId(bm.bookId);
                          setSelectedChapter(bm.chapter);
                          setInitialVerse(bm.verse);
                          setShowBookmarksDrawer(false);
                        }}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-reader-accent-subtle hover:opacity-80 transition-opacity"
                      >
                        Ir al pasaje
                      </button>
                    </div>
                    {bm.text && (
                      <p className="text-xs italic leading-relaxed opacity-85">
                        «{bm.text}»
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
