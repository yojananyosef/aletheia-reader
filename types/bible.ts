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
  versionId?: TranslationId;
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
  selectedVersionId?: TranslationId;
  onSelectVersion?: (id: TranslationId) => void;
}

export interface BookmarkRef {
  bookId: string;
  chapter: number;
  verse: string | number;
  versionId?: TranslationId;
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
  versionId?: TranslationId;
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

// ---------------------------------------------------------------------------
// Multi-version support (ES — 9 traducciones desde alethia-gateway)
// ---------------------------------------------------------------------------

export type TranslationId =
  | 'RV1909'
  | 'BES'
  | 'VBL'
  | 'PDDPT'
  | 'ONBV'
  | 'BLL'
  | 'BLM'
  | 'SpaPlatense'
  | 'SpaRVG';

export const DEFAULT_TRANSLATION_ID: TranslationId = 'ONBV';

export interface TranslationMeta {
  id: TranslationId;
  name: string;
  shortName: string;
  language: string;
  languageName?: string;
  description?: string;
  copyright?: string;
  license?: string;
  licenseUrl?: string;
  year?: string;
  source?: string;
  hasDeuterocanonical?: boolean;
}

export const AVAILABLE_TRANSLATIONS: Record<TranslationId, TranslationMeta> = {
  RV1909: {
    id: 'RV1909',
    name: 'Reina Valera 1909',
    shortName: 'RV1909',
    language: 'es',
    languageName: 'Español',
    description: 'Traducción clásica histórica, fiel al Texto Recibido.',
    copyright: 'Dominio Público',
    license: 'Dominio Público (1909)',
    licenseUrl: 'https://es.wikipedia.org/wiki/Reina-Valera#Revisi%C3%B3n_de_1909',
    year: '1909',
    source: 'Sociedad Bíblica Americana',
    hasDeuterocanonical: false,
  },
  BES: {
    id: 'BES',
    name: 'Biblia en Español Sencillo',
    shortName: 'BES',
    language: 'es',
    languageName: 'Español',
    description: 'Lenguaje contemporáneo accesible de AudioBiblia.org.',
    copyright: '© AudioBiblia.org',
    license: 'CC BY 4.0 Internacional',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/deed.es',
    year: '2018',
    source: 'AudioBiblia.org / alethia-gateway',
    hasDeuterocanonical: false,
  },
  VBL: {
    id: 'VBL',
    name: 'Versión Biblia Libre',
    shortName: 'VBL',
    language: 'es',
    languageName: 'Español',
    description: 'Traducción moderna con abundantes notas de estudio.',
    copyright: '© Versión Biblia Libre',
    license: 'CC BY-SA 4.0 Internacional',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.es',
    year: '2022',
    source: 'biblialibre.org / alethia-gateway',
    hasDeuterocanonical: false,
  },
  PDDPT: {
    id: 'PDDPT',
    name: 'Palabra de Dios para ti',
    shortName: 'PDDPT',
    language: 'es',
    languageName: 'Español',
    description: 'Traducción fiel y contextual.',
    copyright: '© Asociación Bíblica Latinoamericana',
    license: 'CC BY 4.0 Internacional',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/deed.es',
    year: '2010',
    source: 'PDDPT / alethia-gateway',
    hasDeuterocanonical: false,
  },
  ONBV: {
    id: 'ONBV',
    name: 'Open Nueva Biblia Viva',
    shortName: 'ONBV',
    language: 'es',
    languageName: 'Español',
    description: 'Paráfrasis moderna de fácil comprensión.',
    copyright: '© Biblica, Inc.',
    license: 'CC BY-SA 4.0 (Open License)',
    licenseUrl: 'https://www.biblica.com/biblica-license/',
    year: '2008',
    source: 'Biblica, Inc. / Open NBV',
    hasDeuterocanonical: false,
  },
  BLL: {
    id: 'BLL',
    name: 'Biblia Libre Latinoamericano',
    shortName: 'BLL',
    language: 'es',
    languageName: 'Español',
    description: 'Edición latinoamericana de eBible.org.',
    copyright: 'Dominio Público',
    license: 'Dominio Público / CC0',
    licenseUrl: 'https://ebible.org/details.php?id=spaBlL',
    year: '2020',
    source: 'eBible.org',
    hasDeuterocanonical: false,
  },
  BLM: {
    id: 'BLM',
    name: 'Biblia Libre para el Mundo',
    shortName: 'BLM',
    language: 'es',
    languageName: 'Español',
    description: 'Edición español global de eBible.org.',
    copyright: 'Dominio Público',
    license: 'Dominio Público / CC0',
    licenseUrl: 'https://ebible.org/details.php?id=spaBLM',
    year: '2020',
    source: 'eBible.org',
    hasDeuterocanonical: false,
  },
  SpaPlatense: {
    id: 'SpaPlatense',
    name: 'Biblia Platense (Straubinger)',
    shortName: 'PLATENSE',
    language: 'es',
    languageName: 'Español',
    description: 'Traducción comentada con notas exegéticas de Mons. Straubinger (1951).',
    copyright: 'Dominio Público',
    license: 'Dominio Público (1951)',
    licenseUrl: 'https://es.wikipedia.org/wiki/Biblia_Platense',
    year: '1951',
    source: 'Fundación Straubinger / alethia-gateway',
    hasDeuterocanonical: true,
  },
  SpaRVG: {
    id: 'SpaRVG',
    name: 'Reina Valera Gómez (2010)',
    shortName: 'RVG',
    language: 'es',
    languageName: 'Español',
    description: 'Revisión fiel al Texto Recibido por el Dr. H. Gómez.',
    copyright: '© Dr. Humberto Gómez Caballero',
    license: 'CC BY-NC-ND 4.0 Internacional',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-nd/4.0/deed.es',
    year: '2010',
    source: 'ReinaValeraGomez.com',
    hasDeuterocanonical: false,
  },
};

export function getTranslationMeta(id: TranslationId): TranslationMeta {
  return AVAILABLE_TRANSLATIONS[id] ?? AVAILABLE_TRANSLATIONS[DEFAULT_TRANSLATION_ID];
}
