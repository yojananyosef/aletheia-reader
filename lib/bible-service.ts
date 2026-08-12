import { BibleCatalog, BibleBookMeta, ChapterPayload, SectionHeading } from '@/types/bible';

export interface RawVerse {
  number: string | number;
  text: string;
}

export interface RawChapter {
  chapter: number;
  sections?: SectionHeading[];
  verses: RawVerse[];
}

export interface RawBookData {
  id: string;
  name: string;
  testament: 'AT' | 'NT';
  totalChapters: number;
  totalVerses: number;
  toc?: { title: string; chapter: number; verse: number }[];
  chapters: RawChapter[];
}

const bookCache = new Map<string, RawBookData>();
let catalogCache: BibleCatalog | null = null;

/**
 * Obtiene el catálogo maestro de la Biblia (metadatos y los 66 libros)
 */
export async function getBibleCatalog(): Promise<BibleCatalog> {
  if (catalogCache) {
    return catalogCache;
  }

  try {
    const res = await fetch('/json/bible.json');
    if (!res.ok) {
      throw new Error(`Error al cargar el catálogo de la biblia: ${res.status}`);
    }
    const data: BibleCatalog = await res.json();
    catalogCache = data;
    return data;
  } catch (err) {
    console.error('Error cargando bible.json:', err);
    throw err;
  }
}

/**
 * Obtiene la lista de los 66 libros
 */
export async function getBibleBooks(): Promise<BibleBookMeta[]> {
  const catalog = await getBibleCatalog();
  return catalog.books;
}

/**
 * Carga los datos completos de un libro bíblico específico con caché en memoria
 */
export async function getBookData(bookId: string): Promise<RawBookData | null> {
  const normalizedId = bookId.toUpperCase();

  if (bookCache.has(normalizedId)) {
    return bookCache.get(normalizedId) || null;
  }

  try {
    const res = await fetch(`/json/${normalizedId}.json`);
    if (!res.ok) {
      console.warn(`No se pudo cargar el libro ${normalizedId}.json (Status: ${res.status})`);
      return null;
    }
    const data: RawBookData = await res.json();
    bookCache.set(normalizedId, data);
    return data;
  } catch (err) {
    console.error(`Error cargando /json/${normalizedId}.json:`, err);
    return null;
  }
}

/**
 * Obtiene el payload exacto de un capítulo para el lector ComfortBibleReader
 */
export async function getChapterData(
  bookId: string,
  chapterNumber: number
): Promise<ChapterPayload | null> {
  const bookData = await getBookData(bookId);
  if (!bookData || !bookData.chapters) {
    return null;
  }

  const chapter = bookData.chapters.find((c) => Number(c.chapter) === Number(chapterNumber));
  if (!chapter) {
    return null;
  }

  return {
    bookId: bookData.id,
    bookName: bookData.name,
    chapterNumber: Number(chapter.chapter),
    verses: chapter.verses.map((v) => ({
      number: String(v.number),
      text: v.text,
    })),
    sections: chapter.sections || [],
    footnotes: [],
  };
}
