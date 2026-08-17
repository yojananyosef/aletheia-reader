export interface Verse {
  number: string | number;
  text: string;
}

export interface Footnote {
  id: string;
  verseNumber: string | number;
  marker?: string;
  note: string;
  reference?: string;
}

export interface SectionHeading {
  title: string;
  beforeVerse: string | number;
}

export interface ChapterPayload {
  bookId: string;
  bookName: string;
  chapterNumber: number;
  verses: Verse[];
  footnotes?: Footnote[];
  sections?: SectionHeading[];
}

export type ThemeMode = 'pergamino' | 'noche' | 'sepia';

export type FontOption = 'bookerly' | 'atkinson' | 'opendyslexic';

export type LineFocusMode = 'off' | '1-line' | '3-line' | '5-line';

export interface ReaderSettings {
  theme: ThemeMode;
  font: FontOption;
  fontSize: number; // 16px to 28px
  lineHeight: number; // 1.2 to 2.5
  letterSpacing: number; // 0.0 to 0.1 em
  softwareBrightness: number; // 0.3 to 1.0
  lineFocus: LineFocusMode;
  showToolbar: boolean;
  fontWeight: number; // 400 to 700
  bionicReading: boolean;
  phoneticDots: boolean;
}

export interface ComfortBibleReaderProps {
  data: ChapterPayload;
  readerTarget?: ReaderTarget | null;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  onPageChange?: (page: number, totalPages: number) => void;
  onBookmarkVerse?: (verseNumber: string | number) => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  hasPrevChapter?: boolean;
  hasNextChapter?: boolean;
  onOpenBookSelector?: () => void;
  onOpenBookmarks?: () => void;
  bookmarksCount?: number;
}

export interface BookmarkRef {
  bookId: string;
  chapter: number;
  verse: string | number;
}

/**
 * Intent de navegación del lector hacia una posición concreta.
 * - 'verse': saltar a la página del versículo indicado.
 * - 'lastPage': comenzar en la última página del capítulo (navegación hacia atrás, imitando un libro).
 * requestId es un nonce creciente para que re-seleccionar el mismo objetivo
 * (p. ej. el mismo marcador) siempre re-dispare el salto.
 */
export interface ReaderTarget {
  kind: 'verse' | 'lastPage';
  bookId: string;
  chapter: number;
  verse?: string | number;
  requestId: number;
}

export interface BibleBookMeta {
  id: string;
  name: string;
  testament: 'AT' | 'NT';
  totalChapters: number;
  totalVerses: number;
  file: string;
}

export interface BibleCatalog {
  meta: {
    translation: string;
    translationId: string;
    language: string;
    languageName?: string;
    copyright?: string;
    totalBooks: number;
    totalChapters: number;
    totalVerses: number;
  };
  books: BibleBookMeta[];
}

export type TTSStatus = 'idle' | 'playing' | 'paused';

export interface TTSVoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
  default?: boolean;
}

export interface TTSState {
  status: TTSStatus;
  currentVerseIndex: number;
  currentVerseNumber: string | number | null;
  rate: number;
  selectedVoiceURI: string | null;
}

