import type { BibleBookMeta } from '@/types/bible';

export interface ChapterRef {
  bookId: string;
  chapter: number;
}

/**
 * Pure chapter-walking helpers shared by manual navigation (page.tsx) and
 * TTS auto-advance (ComfortBibleReader). Crossing book boundaries is handled
 * here so the end-of-Bible condition is a single `null` check.
 */

function findBookIndex(books: BibleBookMeta[], bookId: string): number {
  return books.findIndex((b) => b.id === bookId);
}

/** Next chapter after (bookId, chapter), or null past the last chapter of the last book. */
export function getNextChapter(
  books: BibleBookMeta[],
  bookId: string,
  chapter: number
): ChapterRef | null {
  const idx = findBookIndex(books, bookId);
  if (idx === -1) return null;
  const book = books[idx];
  if (chapter < book.totalChapters) {
    return { bookId: book.id, chapter: chapter + 1 };
  }
  const nextBook = books[idx + 1];
  if (!nextBook) return null;
  return { bookId: nextBook.id, chapter: 1 };
}

/** Previous chapter before (bookId, chapter), or null before GEN 1. */
export function getPrevChapter(
  books: BibleBookMeta[],
  bookId: string,
  chapter: number
): ChapterRef | null {
  const idx = findBookIndex(books, bookId);
  if (idx === -1) return null;
  if (chapter > 1) {
    return { bookId: books[idx].id, chapter: chapter - 1 };
  }
  const prevBook = books[idx - 1];
  if (!prevBook) return null;
  return { bookId: prevBook.id, chapter: prevBook.totalChapters };
}
