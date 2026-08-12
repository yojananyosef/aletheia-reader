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
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredReadingPosition,
  saveStoredReadingPosition,
  getStoredBookmarks,
  saveStoredBookmarks,
  StoredBookmark,
} from '@/lib/storage-service';

export default function Home() {
  const [books, setBooks] = useState<BibleBookMeta[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('GEN');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [initialVerse, setInitialVerse] = useState<string | number | undefined>(undefined);
  const [chapterPayload, setChapterPayload] = useState<ChapterPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<ThemeMode>('pergamino');

  // Navigation Drawers & Mobile Steps
  const [showBookSelector, setShowBookSelector] = useState<boolean>(false);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState<boolean>(false);
  const [activeTestamentTab, setActiveTestamentTab] = useState<'AT' | 'NT'>('AT');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [browsingBook, setBrowsingBook] = useState<BibleBookMeta | null>(null);
  const [mobileSelectorStep, setMobileSelectorStep] = useState<'books' | 'chapters'>('books');

  // Bookmarks List
  const [bookmarksList, setBookmarksList] = useState<StoredBookmark[]>([]);

  // Load Bible books catalog, stored position, stored theme and bookmarks on mount
  useEffect(() => {
    let isMounted = true;

    const storedPos = getStoredReadingPosition();
    const storedSettings = getStoredSettings();
    const storedBookmarks = getStoredBookmarks();

    if (storedSettings.theme) {
      setTheme(storedSettings.theme);
    }
    if (storedBookmarks.length > 0) {
      setBookmarksList(storedBookmarks);
    }

    getBibleBooks()
      .then((loadedBooks) => {
        if (!isMounted) return;
        setBooks(loadedBooks);
        if (loadedBooks.length > 0) {
          const targetBookId =
            storedPos?.bookId && loadedBooks.some((b) => b.id === storedPos.bookId)
              ? storedPos.bookId
              : loadedBooks[0].id;
          const targetChapter = storedPos?.chapterNumber || 1;

          setSelectedBookId(targetBookId);
          setSelectedChapter(targetChapter);
          if (storedPos?.verseNumber) {
            setInitialVerse(storedPos.verseNumber);
          }

          const current = loadedBooks.find((b) => b.id === targetBookId) || loadedBooks[0];
          setBrowsingBook(current);
        }
      })
      .catch((err) => {
        console.error('Error cargando catálogo bíblico:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist reading position when book or chapter changes
  useEffect(() => {
    if (selectedBookId && selectedChapter) {
      saveStoredReadingPosition({
        bookId: selectedBookId,
        chapterNumber: selectedChapter,
        verseNumber: initialVerse,
      });
    }
  }, [selectedBookId, selectedChapter, initialVerse]);

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

  // Handle Verse Bookmarking with storage persistence
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

      let next: StoredBookmark[];
      if (exists) {
        next = prev.filter(
          (b) =>
            !(
              b.bookId === chapterPayload.bookId &&
              b.chapter === chapterPayload.chapterNumber &&
              String(b.verse) === String(verseNumber)
            )
        );
      } else {
        next = [
          ...prev,
          {
            bookId: chapterPayload.bookId,
            bookName: chapterPayload.bookName,
            chapter: chapterPayload.chapterNumber,
            verse: verseNumber,
            text: verseText,
            createdAt: Date.now(),
          },
        ];
      }
      saveStoredBookmarks(next);
      return next;
    });
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    saveStoredSettings({ theme: newTheme });
  };

  const themeClass =
    theme === 'pergamino'
      ? 'theme-pergamino'
      : theme === 'noche'
      ? 'theme-noche'
      : 'theme-sepia';

  return (
    <div
      className={`relative min-h-[100dvh] flex flex-col w-full transition-colors duration-200 ${themeClass}`}
      style={{
        backgroundColor: 'var(--reader-bg)',
        color: 'var(--reader-text)',
      }}
    >
      {/* Main ComfortBibleReader Component */}
      {loading && !chapterPayload ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 space-y-3 min-h-[100dvh]">
          <Loader2 className="h-8 w-8 animate-spin text-reader-accent" />
          <p className="text-sm font-medium opacity-70">Cargando Sagradas Escrituras...</p>
        </div>
      ) : chapterPayload ? (
        <ComfortBibleReader
          data={chapterPayload}
          initialVerse={initialVerse}
          theme={theme}
          onThemeChange={handleThemeChange}
          onBookmarkVerse={handleBookmarkVerse}
          onNextChapter={handleNextChapter}
          onPrevChapter={handlePrevChapter}
          onOpenBookSelector={() => {
            setBrowsingBook(currentBookMeta || books[0]);
            setMobileSelectorStep('books');
            setShowBookSelector(true);
          }}
          onOpenBookmarks={() => setShowBookmarksDrawer(true)}
          bookmarksCount={bookmarksList.length}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 min-h-[100dvh]">
          <p>No se pudo cargar el capítulo seleccionado.</p>
        </div>
      )}

      {/* Full Bible Book & Chapter Navigation Modal */}
      <Dialog
        isOpen={showBookSelector}
        onClose={() => setShowBookSelector(false)}
        position="center"
        title="Explorador de Libros y Capítulos de la Biblia"
        className="max-w-4xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden p-0"
      >
        {/* Modal Header */}
        <DialogHeader onClose={() => setShowBookSelector(false)}>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-reader-accent shrink-0" />
            <DialogTitle className="text-sm sm:text-lg">
              Explorador Bíblico (66 Libros)
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Search and Testament Tabs */}
        <div
          className={`p-3 sm:p-4 border-b border-[var(--reader-border)] space-y-2.5 ${
            mobileSelectorStep === 'chapters' ? 'hidden md:block' : 'block'
          }`}
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
            <input
              type="text"
              placeholder="Buscar libro (ej. Génesis, Salmos, Mateo, Romanos)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--reader-border)] bg-transparent pl-10 pr-9 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-reader-accent"
              style={{
                color: 'var(--reader-text)',
              }}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Testament Switcher Tabs (Only if not searching) */}
          {!searchQuery && (
            <Tabs value={activeTestamentTab} onValueChange={(val) => setActiveTestamentTab(val as 'AT' | 'NT')}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="AT">
                  Antiguo Testamento (39)
                </TabsTrigger>
                <TabsTrigger value="NT">
                  Nuevo Testamento (27)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Body: Responsive 2-Column Browser */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[320px]">
          {/* Left Column: Books List */}
          <div
            className={`md:col-span-6 border-r border-[var(--reader-border)] overflow-y-auto custom-scrollbar p-2.5 sm:p-3 space-y-1 ${
              mobileSelectorStep === 'chapters' ? 'hidden md:block' : 'block'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-bold opacity-60 px-2 py-1">
              {searchQuery
                ? `Resultados (${filteredBooks.length})`
                : activeTestamentTab === 'AT'
                ? 'Libros del Antiguo Testamento'
                : 'Libros del Nuevo Testamento'}
            </div>
            {filteredBooks.map((book) => {
              const isSelected = browsingBook?.id === book.id;
              const isCurrent = selectedBookId === book.id;

              return (
                <Button
                  key={book.id}
                  variant={isSelected ? 'default' : isCurrent ? 'subtle' : 'ghost'}
                  onClick={() => {
                    setBrowsingBook(book);
                    setMobileSelectorStep('chapters');
                  }}
                  className="w-full justify-between px-3 py-2.5 h-auto text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {book.id}
                    </Badge>
                    <span className="font-medium">{book.name}</span>
                  </div>
                  <span className="text-xs opacity-75 font-normal">
                    {book.totalChapters} cap.
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Right Column: Chapter Grid */}
          <div
            className={`md:col-span-6 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 flex flex-col ${
              mobileSelectorStep === 'books' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {browsingBook ? (
              <>
                {/* Header for Chapter view (with Mobile Back Button) */}
                <div className="border-b border-[var(--reader-border)] pb-3 mb-3 sm:mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Mobile Back to Books Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMobileSelectorStep('books')}
                      className="md:hidden font-bold"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Libros</span>
                    </Button>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold truncate">{browsingBook.name}</h3>
                      <p className="text-[11px] opacity-70">
                        {browsingBook.totalChapters} capítulos disponibles
                      </p>
                    </div>
                  </div>

                  <Badge variant="subtle">
                    {browsingBook.testament === 'AT' ? 'AT' : 'NT'}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 pb-4">
                  {Array.from({ length: browsingBook.totalChapters }, (_, i) => i + 1).map((chapNum) => {
                    const isCurrentActive =
                      selectedBookId === browsingBook.id && selectedChapter === chapNum;

                    return (
                      <Button
                        key={chapNum}
                        variant={isCurrentActive ? "default" : "outline"}
                        size="default"
                        onClick={() => {
                          setLoading(true);
                          setSelectedBookId(browsingBook.id);
                          setSelectedChapter(chapNum);
                          setInitialVerse(undefined);
                          saveStoredReadingPosition({
                            bookId: browsingBook.id,
                            chapterNumber: chapNum,
                            verseNumber: undefined,
                            page: 1,
                          });
                          setShowBookSelector(false);
                        }}
                        className={`min-h-[44px] font-bold text-sm ${isCurrentActive ? 'ring-2 ring-offset-2 ring-reader-accent' : ''}`}
                        title={`${browsingBook.name} Capítulo ${chapNum}`}
                      >
                        {chapNum}
                      </Button>
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
      </Dialog>

      {/* Bookmarks History Drawer */}
      <Dialog
        isOpen={showBookmarksDrawer}
        onClose={() => setShowBookmarksDrawer(false)}
        position="right"
        title="Versículos Guardados"
        className="max-w-md h-full pb-safe"
      >
        <DialogHeader onClose={() => setShowBookmarksDrawer(false)}>
          <div className="flex items-center gap-2">
            <BookmarkCheck className="h-5 w-5 text-reader-accent" />
            <DialogTitle>Versículos Guardados</DialogTitle>
          </div>
        </DialogHeader>

        <DialogContent className="max-h-[85vh] space-y-3">
          {bookmarksList.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-60">
              <BookMarked className="h-12 w-12 text-reader-accent opacity-50" />
              <p className="text-sm font-medium">No has guardado versículos todavía.</p>
              <p className="text-xs">
                Toca cualquier número de versículo durante la lectura para guardarlo aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {bookmarksList.map((bm, index) => (
                <Card
                  key={`${bm.bookId}-${bm.chapter}-${bm.verse}-${index}`}
                  className="p-3 transition-all hover:bg-neutral-500/5 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-reader-accent">
                      {bm.bookName} {bm.chapter}:{bm.verse}
                    </span>
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => {
                        setLoading(true);
                        setSelectedBookId(bm.bookId);
                        setSelectedChapter(bm.chapter);
                        setInitialVerse(bm.verse);
                        saveStoredReadingPosition({
                          bookId: bm.bookId,
                          chapterNumber: bm.chapter,
                          verseNumber: bm.verse,
                        });
                        setShowBookmarksDrawer(false);
                      }}
                      className="text-xs font-semibold h-7 px-2.5"
                    >
                      <span>Ir al pasaje</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  {bm.text && (
                    <p className="text-xs italic leading-relaxed opacity-85">
                      «{bm.text}»
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
