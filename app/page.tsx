'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BibleBookMeta, ChapterPayload, ThemeMode, ReaderTarget, TranslationId, AVAILABLE_TRANSLATIONS, DEFAULT_TRANSLATION_ID } from '@/types/bible';
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
  getStoredVersionId,
  saveStoredVersionId,
} from '@/lib/storage-service';

export default function Home() {
  const [selectedVersionId, setSelectedVersionId] = useState<TranslationId>(DEFAULT_TRANSLATION_ID);
  const [books, setBooks] = useState<BibleBookMeta[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('GEN');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [readerTarget, setReaderTarget] = useState<ReaderTarget | null>(null);
  const targetRequestRef = useRef(0);
  const [chapterPayload, setChapterPayload] = useState<ChapterPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<ThemeMode>('pergamino');

  const [showBookSelector, setShowBookSelector] = useState<boolean>(false);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState<boolean>(false);
  const [activeTestamentTab, setActiveTestamentTab] = useState<'AT' | 'NT'>('AT');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [browsingBook, setBrowsingBook] = useState<BibleBookMeta | null>(null);
  const [mobileSelectorStep, setMobileSelectorStep] = useState<'books' | 'chapters'>('books');

  const [bookmarksList, setBookmarksList] = useState<StoredBookmark[]>([]);

  const selectedVersionMeta = AVAILABLE_TRANSLATIONS[selectedVersionId] ?? AVAILABLE_TRANSLATIONS[DEFAULT_TRANSLATION_ID];

  // Load Bible books catalog, stored position, stored theme and bookmarks on mount (version-aware)
  useEffect(() => {
    let isMounted = true;

    const storedPos = getStoredReadingPosition();
    const storedSettings = getStoredSettings();
    const storedBookmarks = getStoredBookmarks();
    const storedVersion = getStoredVersionId();

    if (storedSettings.theme) setTheme(storedSettings.theme);
    if (storedBookmarks.length > 0) setBookmarksList(storedBookmarks);
    setSelectedVersionId(storedVersion);

    // Use stored position version if it differs from selected (migration)
    const initialVersion = storedPos?.versionId || storedVersion;

    getBibleBooks(initialVersion)
      .then((loadedBooks) => {
        if (!isMounted) return;
        setBooks(loadedBooks);
        if (loadedBooks.length > 0) {
          // Ensure initial version reflects storedPos if present
          if (initialVersion !== storedVersion) {
            setSelectedVersionId(initialVersion as TranslationId);
          }
          const targetBookId =
            storedPos?.bookId && loadedBooks.some((b) => b.id === storedPos.bookId)
              ? storedPos.bookId
              : loadedBooks[0].id;
          const targetChapter = storedPos?.chapterNumber || 1;

          setSelectedBookId(targetBookId);
          setSelectedChapter(targetChapter);
          if (storedPos?.verseNumber) {
            setReaderTarget({
              kind: 'verse',
              bookId: storedPos.bookId,
              chapter: storedPos.chapterNumber,
              verse: storedPos.verseNumber,
              requestId: ++targetRequestRef.current,
              versionId: (storedPos.versionId as TranslationId) || initialVersion,
            });
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

  // Reload books when version changes (on-demand cache)
  useEffect(() => {
    let isMounted = true;
    // Skip initial mount's double fetch if already loaded for same version
    getBibleBooks(selectedVersionId)
      .then((loadedBooks) => {
        if (!isMounted) return;
        setBooks(loadedBooks);
        // If current book not in new version (e.g. deuterocanonical switching), fallback to GEN
        if (!loadedBooks.some((b) => b.id === selectedBookId)) {
          setSelectedBookId(loadedBooks[0].id);
          setSelectedChapter(1);
          setReaderTarget(null);
        } else {
          // Validate chapter exists in new version's book
          const meta = loadedBooks.find((b) => b.id === selectedBookId);
          if (meta && selectedChapter > meta.totalChapters) {
            setSelectedChapter(meta.totalChapters);
            setReaderTarget({
              kind: 'lastPage',
              bookId: selectedBookId,
              chapter: meta.totalChapters,
              requestId: ++targetRequestRef.current,
              versionId: selectedVersionId,
            });
          }
        }
        const current = loadedBooks.find((b) => b.id === selectedBookId) || loadedBooks[0];
        setBrowsingBook(current);
      })
      .catch((err) => console.error('Error cargando catálogo versión', selectedVersionId, err));
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersionId]);

  // Persist reading position when book or chapter or version changes
  useEffect(() => {
    if (selectedBookId && selectedChapter) {
      saveStoredReadingPosition({
        bookId: selectedBookId,
        chapterNumber: selectedChapter,
        verseNumber: readerTarget?.kind === 'verse' ? readerTarget.verse : undefined,
        versionId: selectedVersionId,
      });
    }
  }, [selectedBookId, selectedChapter, readerTarget, selectedVersionId]);

  // Load chapter data when book or chapter or version changes
  useEffect(() => {
    let isMounted = true;

    async function fetchChapter() {
      try {
        const data = await getChapterData(selectedVersionId, selectedBookId, selectedChapter);
        if (isMounted && data) {
          setChapterPayload(data);
          setLoading(false);
        } else if (isMounted) {
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
      setLoading(true);
      fetchChapter();
    }

    return () => {
      isMounted = false;
    };
  }, [selectedBookId, selectedChapter, selectedVersionId]);

  const handleVersionChange = (newVersionId: TranslationId) => {
    saveStoredVersionId(newVersionId);
    setSelectedVersionId(newVersionId);
    setLoading(true);
    setReaderTarget(null);
  };

  const currentBookMeta = useMemo(() => {
    return books.find((b) => b.id === selectedBookId) || books[0];
  }, [books, selectedBookId]);

  const filteredBooks = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return books.filter(
        (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
      );
    }
    return books.filter((b) => b.testament === activeTestamentTab);
  }, [books, activeTestamentTab, searchQuery]);

  const handleNextChapter = () => {
    if (!currentBookMeta) return;

    if (selectedChapter < currentBookMeta.totalChapters) {
      setLoading(true);
      setSelectedChapter((prev) => prev + 1);
      setReaderTarget(null);
    } else {
      const currentIndex = books.findIndex((b) => b.id === selectedBookId);
      if (currentIndex !== -1 && currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        setLoading(true);
        setSelectedBookId(nextBook.id);
        setSelectedChapter(1);
        setReaderTarget(null);
      }
    }
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setLoading(true);
      setSelectedChapter((prev) => prev - 1);
      setReaderTarget({
        kind: 'lastPage',
        bookId: selectedBookId,
        chapter: selectedChapter - 1,
        requestId: ++targetRequestRef.current,
        versionId: selectedVersionId,
      });
    } else {
      const currentIndex = books.findIndex((b) => b.id === selectedBookId);
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1];
        setLoading(true);
        setSelectedBookId(prevBook.id);
        setSelectedChapter(prevBook.totalChapters);
        setReaderTarget({
          kind: 'lastPage',
          bookId: prevBook.id,
          chapter: prevBook.totalChapters,
          requestId: ++targetRequestRef.current,
          versionId: selectedVersionId,
        });
      }
    }
  };

  const handleBookmarkVerse = (verseNumber: string | number) => {
    if (!chapterPayload) return;
    const verseObj = chapterPayload.verses.find((v) => String(v.number) === String(verseNumber));
    const verseText = verseObj?.text;

    setBookmarksList((prev) => {
      const exists = prev.some(
        (b) =>
          b.bookId === chapterPayload.bookId &&
          b.chapter === chapterPayload.chapterNumber &&
          String(b.verse) === String(verseNumber) &&
          (b.versionId || DEFAULT_TRANSLATION_ID) === selectedVersionId
      );

      let next: StoredBookmark[];
      if (exists) {
        next = prev.filter(
          (b) =>
            !(
              b.bookId === chapterPayload.bookId &&
              b.chapter === chapterPayload.chapterNumber &&
              String(b.verse) === String(verseNumber) &&
              (b.versionId || DEFAULT_TRANSLATION_ID) === selectedVersionId
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
            versionId: selectedVersionId,
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

  // Bookmarks filtered by version (show current version first, but keep all for now with badge)
  const visibleBookmarks = bookmarksList; // keep all; UI will badge version

  return (
    <div
      className={`relative h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col w-full transition-colors duration-200 ${themeClass}`}
      style={{
        backgroundColor: 'var(--reader-bg)',
        color: 'var(--reader-text)',
      }}
    >
      {loading && !chapterPayload ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 space-y-3 min-h-[100dvh]">
          <Loader2 className="h-8 w-8 animate-spin text-reader-accent" />
          <p className="text-sm font-medium opacity-70" suppressHydrationWarning>Cargando Sagradas Escrituras — {selectedVersionMeta.shortName}...</p>
        </div>
      ) : chapterPayload ? (
        <ComfortBibleReader
          data={chapterPayload}
          readerTarget={readerTarget}
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
          bookmarksCount={bookmarksList.filter((b) => (b.versionId || DEFAULT_TRANSLATION_ID) === selectedVersionId).length}
          selectedVersionId={selectedVersionId}
          onSelectVersion={handleVersionChange}
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
        <DialogHeader onClose={() => setShowBookSelector(false)}>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-reader-accent shrink-0" />
            <DialogTitle className="text-sm sm:text-lg">
              Explorador Bíblico — {selectedVersionMeta.shortName}
              <span className="ml-2 text-xs font-normal opacity-60 hidden sm:inline">
                {books.length} libros {selectedVersionMeta.hasDeuterocanonical ? '· +7 deuterocanónicos' : ''} · {selectedVersionMeta.copyright}
              </span>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div
          className={`p-3 sm:p-4 border-b border-[var(--reader-border)] space-y-2.5 ${
            mobileSelectorStep === 'chapters' ? 'hidden md:block' : 'block'
          }`}
        >
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

          {!searchQuery && (
            <Tabs value={activeTestamentTab} onValueChange={(val) => setActiveTestamentTab(val as 'AT' | 'NT')}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="AT">
                  Antiguo Testamento ({books.filter((b) => b.testament === 'AT').length})
                </TabsTrigger>
                <TabsTrigger value="NT">
                  Nuevo Testamento ({books.filter((b) => b.testament === 'NT').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[320px]">
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

          <div
            className={`md:col-span-6 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 flex flex-col ${
              mobileSelectorStep === 'books' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {browsingBook ? (
              <>
                <div className="border-b border-[var(--reader-border)] pb-3 mb-3 sm:mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
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
                          setReaderTarget(null);
                          saveStoredReadingPosition({
                            bookId: browsingBook.id,
                            chapterNumber: chapNum,
                            verseNumber: undefined,
                            page: 1,
                            versionId: selectedVersionId,
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
            <DialogTitle>Versículos Guardados — {selectedVersionMeta.shortName}</DialogTitle>
          </div>
        </DialogHeader>

        <DialogContent className="max-h-[85vh] space-y-3">
          {visibleBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-60">
              <BookMarked className="h-12 w-12 text-reader-accent opacity-50" />
              <p className="text-sm font-medium">No has guardado versículos todavía.</p>
              <p className="text-xs">
                Toca cualquier número de versículo durante la lectura para guardarlo aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {visibleBookmarks.map((bm, index) => {
                const bmVersion = (bm.versionId as TranslationId) || DEFAULT_TRANSLATION_ID;
                const meta = AVAILABLE_TRANSLATIONS[bmVersion];
                return (
                <Card
                  key={`${bm.bookId}-${bm.chapter}-${bm.verse}-${bm.versionId}-${index}`}
                  className="p-3 transition-all hover:bg-neutral-500/5 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-reader-accent flex items-center gap-1.5">
                      {bm.bookName} {bm.chapter}:{bm.verse}
                      <Badge variant="subtle" className="text-[10px] px-1.5 py-0 font-bold">
                        {meta?.shortName || bmVersion}
                      </Badge>
                    </span>
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => {
                        if (bmVersion !== selectedVersionId) {
                          handleVersionChange(bmVersion);
                        }
                        setLoading(true);
                        setSelectedBookId(bm.bookId);
                        setSelectedChapter(bm.chapter);
                        setReaderTarget({
                          kind: 'verse',
                          bookId: bm.bookId,
                          chapter: bm.chapter,
                          verse: bm.verse,
                          requestId: ++targetRequestRef.current,
                          versionId: bmVersion,
                        });
                        saveStoredReadingPosition({
                          bookId: bm.bookId,
                          chapterNumber: bm.chapter,
                          verseNumber: bm.verse,
                          versionId: bmVersion,
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
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
