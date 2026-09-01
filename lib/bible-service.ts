import {
  BibleCatalog,
  BibleBookMeta,
  ChapterPayload,
  Footnote,
  SectionHeading,
  TranslationId,
  DEFAULT_TRANSLATION_ID,
  AVAILABLE_TRANSLATIONS,
} from '@/types/bible';

export interface RawVerse {
  number: string | number;
  text: string;
}

export interface RawFootnote {
  marker?: string;
  text: string;
  reference?: string;
}

export interface RawChapter {
  chapter: number;
  sections?: SectionHeading[];
  verses: RawVerse[];
  footnotes?: RawFootnote[];
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

// Gateway JSON shape (chapters as dict, verseDisplay, headings)
interface GatewayVerse {
  number: number;
  text: string;
  verseDisplay?: string;
  endNumber?: number;
  headings?: string[];
  footnotes?: { id: string; caller: string; text: string }[];
}

interface GatewayChapter {
  chapter: number;
  verses: GatewayVerse[];
}

interface GatewayBookJson {
  versionId: string;
  bookCode: string;
  bookName: string;
  testament: 'AT' | 'NT';
  chapters: Record<string, GatewayChapter> | GatewayChapter[];
}

const bookCache = new Map<string, RawBookData>();
const catalogCache = new Map<string, BibleCatalog>();

function normalizeTranslationId(id?: string | null): TranslationId {
  if (!id) return DEFAULT_TRANSLATION_ID;
  const upper = id.toUpperCase();
  // legacy spaonbv
  if (upper === 'SPAONBV' || upper === 'ONBV') return 'ONBV';
  const valid: TranslationId[] = [
    'RV1909',
    'BES',
    'VBL',
    'PDDPT',
    'ONBV',
    'BLL',
    'BLM',
    'SpaPlatense',
    'SpaRVG',
  ];
  const found = valid.find((v) => v.toUpperCase() === upper);
  return (found as TranslationId) ?? DEFAULT_TRANSLATION_ID;
}

export function getAvailableTranslations() {
  return Object.values(AVAILABLE_TRANSLATIONS);
}

function adaptGatewayBook(data: GatewayBookJson, fallbackId: string): RawBookData {
  const id = data.bookCode || fallbackId;
  const name = data.bookName || id;
  const testament = (data.testament as 'AT' | 'NT') || 'AT';

  // chapters can be array (legacy reader) or dict (gateway)
  let chaptersArray: GatewayChapter[] = [];
  if (Array.isArray(data.chapters)) {
    // Already legacy shape — map directly if it has verses with string numbers
    // But legacy reader chapters already have sections/footnotes; handle both
    const arr = data.chapters as unknown as RawChapter[];
    // If it looks like RawChapter already, return as-is
    if (arr.length > 0 && (arr[0] as RawChapter).verses) {
      const legacy = data as unknown as RawBookData;
      if (legacy.id) return legacy;
    }
    chaptersArray = (data.chapters as unknown as GatewayChapter[]);
  } else if (data.chapters && typeof data.chapters === 'object') {
    const dict = data.chapters as Record<string, GatewayChapter>;
    chaptersArray = Object.values(dict).sort((a, b) => a.chapter - b.chapter);
  }

  const rawChapters: RawChapter[] = chaptersArray.map((ch) => {
    const sections: SectionHeading[] = [];
    const verses: RawVerse[] = ch.verses.map((v) => {
      // headings → sections
      if (v.headings && v.headings.length > 0) {
        for (const h of v.headings) {
          sections.push({ title: h, beforeVerse: String(v.verseDisplay || v.number) });
        }
      }
      // Preserve verseDisplay (e.g. "11-12") as number string
      const num = v.verseDisplay ? String(v.verseDisplay) : String(v.number);
      return { number: num, text: v.text };
    });

    // footnotes from gateway are per-verse; collect if any
    const footnotes: RawFootnote[] = [];
    for (const v of ch.verses) {
      if (v.footnotes) {
        for (const fn of v.footnotes) {
          footnotes.push({ marker: fn.caller, text: fn.text, reference: `${id} ${ch.chapter}:${v.number}` });
        }
      }
    }

    return {
      chapter: ch.chapter,
      verses,
      sections: sections.length > 0 ? sections : undefined,
      footnotes: footnotes.length > 0 ? footnotes : undefined,
    };
  });

  // Build toc from sections for reader compat
  const toc: { title: string; chapter: number; verse: number }[] = [];
  for (const ch of rawChapters) {
    if (ch.sections) {
      for (const s of ch.sections) {
        toc.push({ title: s.title, chapter: ch.chapter, verse: Number(String(s.beforeVerse).split('-')[0]) || 0 });
      }
    }
  }

  const totalChapters = rawChapters.length;
  const totalVerses = rawChapters.reduce((acc, c) => acc + c.verses.length, 0);

  return {
    id,
    name,
    testament,
    totalChapters,
    totalVerses,
    toc: toc.length > 0 ? toc : undefined,
    chapters: rawChapters,
  };
}

/**
 * Obtiene el catálogo maestro de la Biblia para una versión.
 */
export async function getBibleCatalog(versionId?: string | null): Promise<BibleCatalog> {
  const vid = normalizeTranslationId(versionId);
  if (catalogCache.has(vid)) return catalogCache.get(vid)!;

  // Try new versioned path first: /data/bibles/{versionId}/bible.json
  // Fallback to legacy /json/bible.json for ONBV during transition
  const candidates = [
    `/data/bibles/${vid}/bible.json`,
    vid === 'ONBV' ? '/json/bible.json' : null,
    // also try gateway manifest fallback
    `/data/bibles/manifest.json`,
  ].filter(Boolean) as string[];

  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      // If it's the global manifest (array), build catalog from it
      if (Array.isArray(data)) {
        const entry = data.find((m: { id: string }) => m.id.toUpperCase() === vid.toUpperCase());
        if (!entry) continue;
        // Try to load the versioned bible.json after finding entry
        continue;
      }
      // It's a BibleCatalog
      if (data.meta && data.books) {
        catalogCache.set(vid, data as BibleCatalog);
        return data as BibleCatalog;
      }
    } catch {
      continue;
    }
  }

  // Fallback: generate minimal catalog from book list if fetch fails
  throw new Error(`Error al cargar el catálogo para ${vid}`);
}

/**
 * Obtiene la lista de libros para una versión.
 */
export async function getBibleBooks(versionId?: string | null): Promise<BibleBookMeta[]> {
  const catalog = await getBibleCatalog(versionId);
  return catalog.books;
}

/**
 * Carga los datos completos de un libro bíblico específico con caché en memoria (version-aware).
 */
export async function getBookData(
  bookId: string,
  versionId?: string | null
): Promise<RawBookData | null> {
  const normalizedId = bookId.toUpperCase();
  const vid = normalizeTranslationId(versionId);
  const cacheKey = `${vid}:${normalizedId}`;

  if (bookCache.has(cacheKey)) {
    return bookCache.get(cacheKey) || null;
  }

  // Try versioned path first
  const candidates = [
    `/data/bibles/${vid}/${normalizedId}.json`,
    // legacy fallback for ONBV
    vid === 'ONBV' ? `/json/${normalizedId}.json` : null,
  ].filter(Boolean) as string[];

  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();

      // Detect gateway shape vs legacy reader shape
      let data: RawBookData;
      if (json.versionId || json.bookCode || (json.chapters && !Array.isArray(json.chapters))) {
        data = adaptGatewayBook(json as GatewayBookJson, normalizedId);
      } else if (json.id && Array.isArray(json.chapters)) {
        data = json as RawBookData;
      } else {
        continue;
      }

      bookCache.set(cacheKey, data);
      return data;
    } catch {
      continue;
    }
  }

  console.warn(`No se pudo cargar el libro ${normalizedId} para versión ${vid}`);
  return null;
}

/**
 * Obtiene el payload exacto de un capítulo para el lector ComfortBibleReader (version-aware).
 * Overload: getChapterData(bookId, chapterNumber) defaults to ONBV for backward compat.
 *           getChapterData(versionId, bookId, chapterNumber) preferred.
 */
export async function getChapterData(
  bookIdOrVersion: string,
  chapterNumberOrBookId: number | string,
  chapterNumberMaybe?: number
): Promise<ChapterPayload | null> {
  // Detect overload: (versionId, bookId, chapter) vs (bookId, chapter)
  let versionId: string | null;
  let bookId: string;
  let chapterNumber: number;

  if (typeof chapterNumberOrBookId === 'string' && typeof chapterNumberMaybe === 'number') {
    versionId = bookIdOrVersion;
    bookId = chapterNumberOrBookId;
    chapterNumber = chapterNumberMaybe;
  } else {
    versionId = null;
    bookId = bookIdOrVersion;
    chapterNumber = chapterNumberOrBookId as number;
  }

  const vid = normalizeTranslationId(versionId);
  const bookData = await getBookData(bookId, vid);
  if (!bookData || !bookData.chapters) return null;

  const chapter = bookData.chapters.find((c) => Number(c.chapter) === Number(chapterNumber));
  if (!chapter) return null;

  const footnotes: Footnote[] = (chapter.footnotes || []).map((fn, idx) => {
    let verseNumber: string | number = '';
    if (fn.reference) {
      const parts = fn.reference.split(':');
      verseNumber = parts.length > 1 ? parts[1].trim() : fn.reference.trim();
    }
    return {
      id: `fn-${bookData.id}-${chapter.chapter}-${idx}`,
      verseNumber,
      marker: fn.marker || '*',
      note: fn.text,
      reference: fn.reference,
    };
  });

  return {
    bookId: bookData.id,
    bookName: bookData.name,
    chapterNumber: Number(chapter.chapter),
    verses: chapter.verses.map((v) => ({
      number: String(v.number),
      text: v.text,
    })),
    sections: chapter.sections || [],
    footnotes,
    versionId: vid,
  };
}
