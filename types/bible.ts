export interface Verse {
  number: number;
  text: string;
}

export interface Footnote {
  id: string;
  verseNumber: number;
  note: string;
}

export interface ChapterPayload {
  bookId: string;
  bookName: string;
  chapterNumber: number;
  verses: Verse[];
  footnotes?: Footnote[];
}

export interface ComfortBibleReaderProps {
  data: ChapterPayload;
  initialVerse?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  onBookmarkVerse?: (verseNumber: number) => void;
}

export type ThemeMode = 'pergamino' | 'noche' | 'sepia';

export type FontOption = 'bookerly' | 'atkinson' | 'opendyslexic';

export type LineFocusMode = 'off' | '1-line' | '3-line' | '5-line';

export interface ReaderSettings {
  theme: ThemeMode;
  font: FontOption;
  fontSize: number; // 16px to 28px
  lineHeight: number; // 1.4 to 2.0
  softwareBrightness: number; // 0.3 to 1.0
  lineFocus: LineFocusMode;
  showToolbar: boolean;
  fontWeight: number; // 400 to 700
}
