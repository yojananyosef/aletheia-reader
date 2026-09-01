import { ReaderSettings, TranslationId, DEFAULT_TRANSLATION_ID } from '@/types/bible';

const STORAGE_KEYS = {
  SETTINGS: 'alethia_reader_settings',
  POSITION: 'alethia_reading_position',
  BOOKMARKS: 'alethia_bookmarks',
  TTS: 'alethia_tts_settings',
  SELECTED_VERSION: 'alethia_selected_version',
};

export interface StoredReadingPosition {
  bookId: string;
  chapterNumber: number;
  verseNumber?: string | number;
  page?: number;
  updatedAt: number;
  versionId?: TranslationId;
}

export interface StoredBookmark {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: string | number;
  text?: string;
  createdAt?: number;
  versionId?: TranslationId;
}

export interface StoredTTSSettings {
  rate: number;
  selectedVoiceURI: string | null;
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'pergamino',
  font: 'bookerly',
  fontSize: 18,
  lineHeight: 1.6,
  letterSpacing: 0.02,
  softwareBrightness: 1.0,
  lineFocus: 'off',
  showToolbar: true,
  fontWeight: 400,
  bionicReading: false,
  phoneticDots: false,
};

// Safe LocalStorage access
function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeVersionId(id?: string | null): TranslationId {
  if (!id) return DEFAULT_TRANSLATION_ID;
  const u = id.toUpperCase();
  if (u === 'SPAONBV') return 'ONBV';
  const MAP: Record<string, TranslationId> = {
    RV1909: 'RV1909',
    BES: 'BES',
    VBL: 'VBL',
    PDDPT: 'PDDPT',
    ONBV: 'ONBV',
    BLL: 'BLL',
    BLM: 'BLM',
    SPAPLATENSE: 'SpaPlatense',
    PLATENSE: 'SpaPlatense',
    SPARVG: 'SpaRVG',
    RVG: 'SpaRVG',
  };
  return MAP[u] ?? DEFAULT_TRANSLATION_ID;
}

// ---------------------------------------------------------------------------
// Version selection
// ---------------------------------------------------------------------------

export function getStoredVersionId(): TranslationId {
  if (!isStorageAvailable()) return DEFAULT_TRANSLATION_ID;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_VERSION);
    if (!raw) return DEFAULT_TRANSLATION_ID;
    // Stored as plain string or JSON string
    const parsed = raw.startsWith('"') ? JSON.parse(raw) : raw;
    return normalizeVersionId(parsed);
  } catch {
    return DEFAULT_TRANSLATION_ID;
  }
}

export function saveStoredVersionId(versionId: TranslationId): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_VERSION, versionId);
  } catch (e) {
    console.warn('Error guardando alethia_selected_version:', e);
  }
}

/**
 * Obtiene la configuración de lectura guardada (Tema, Fuente, Tamaño, Brillo, Line Focus)
 */
export function getStoredSettings(): ReaderSettings {
  if (!isStorageAvailable()) return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.warn('Error leyendo alethia_reader_settings de localStorage:', e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Guarda las preferencias de lectura en localStorage
 */
export function saveStoredSettings(settings: Partial<ReaderSettings>): void {
  if (!isStorageAvailable()) return;
  try {
    const current = getStoredSettings();
    const next = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
  } catch (e) {
    console.warn('Error guardando alethia_reader_settings en localStorage:', e);
  }
}

/**
 * Obtiene la última posición de lectura (Libro, Capítulo, Versículo/Página) — version-aware con migración legacy.
 */
export function getStoredReadingPosition(): StoredReadingPosition | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POSITION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migration: legacy without versionId → ONBV
    if (parsed && !parsed.versionId) {
      parsed.versionId = DEFAULT_TRANSLATION_ID;
    } else if (parsed?.versionId) {
      parsed.versionId = normalizeVersionId(parsed.versionId);
    }
    return parsed as StoredReadingPosition;
  } catch (e) {
    console.warn('Error leyendo alethia_reading_position de localStorage:', e);
    return null;
  }
}

/**
 * Guarda la posición de lectura actual en localStorage (version-aware).
 */
export function saveStoredReadingPosition(pos: {
  bookId: string;
  chapterNumber: number;
  verseNumber?: string | number;
  page?: number;
  versionId?: TranslationId;
}): void {
  if (!isStorageAvailable()) return;
  try {
    const payload: StoredReadingPosition = {
      bookId: pos.bookId,
      chapterNumber: pos.chapterNumber,
      verseNumber: pos.verseNumber,
      page: pos.page,
      versionId: pos.versionId ? normalizeVersionId(pos.versionId) : getStoredVersionId(),
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify(payload));
  } catch (e) {
    console.warn('Error guardando alethia_reading_position en localStorage:', e);
  }
}

/**
 * Obtiene la lista de versículos guardados en marcadores — con migración versionId.
 */
export function getStoredBookmarks(): StoredBookmark[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (!raw) return [];
    const parsed: StoredBookmark[] = JSON.parse(raw);
    return parsed.map((b) => ({
      ...b,
      versionId: b.versionId ? normalizeVersionId(b.versionId) : DEFAULT_TRANSLATION_ID,
    }));
  } catch (e) {
    console.warn('Error leyendo alethia_bookmarks de localStorage:', e);
    return [];
  }
}

/**
 * Guarda la lista de marcadores en localStorage
 */
export function saveStoredBookmarks(bookmarks: StoredBookmark[]): void {
  if (!isStorageAvailable()) return;
  try {
    const normalized = bookmarks.map((b) => ({
      ...b,
      versionId: b.versionId ? normalizeVersionId(b.versionId) : getStoredVersionId(),
    }));
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(normalized));
  } catch (e) {
    console.warn('Error guardando alethia_bookmarks en localStorage:', e);
  }
}

/**
 * Obtiene las preferencias de síntesis de voz (Velocidad y Voz)
 */
export function getStoredTTSSettings(): StoredTTSSettings | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TTS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error leyendo alethia_tts_settings de localStorage:', e);
    return null;
  }
}

/**
 * Guarda las preferencias de síntesis de voz en localStorage
 */
export function saveStoredTTSSettings(settings: StoredTTSSettings): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.TTS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Error guardando alethia_tts_settings en localStorage:', e);
  }
}

/**
 * Restablece solo la configuración tipográfica a los valores recomendados.
 * No afecta tema, fuente, brillo por software ni enfoque de líneas.
 */
export function resetTypographySettings(): ReaderSettings {
  const current = getStoredSettings();
  const reset: ReaderSettings = {
    ...current,
    fontSize: 18,
    lineHeight: 1.6,
    letterSpacing: 0.02,
    fontWeight: 400,
    bionicReading: false,
    phoneticDots: false,
  };
  saveStoredSettings(reset);
  return reset;
}
