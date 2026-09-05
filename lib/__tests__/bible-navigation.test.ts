import { describe, it, expect } from 'vitest';
import { getNextChapter, getPrevChapter } from '../bible-navigation';
import type { BibleBookMeta } from '@/types/bible';

const BOOKS: BibleBookMeta[] = [
  { id: 'GEN', name: 'Génesis', testament: 'AT', totalChapters: 50, totalVerses: 1533, file: 'GEN.json' },
  { id: 'EXO', name: 'Éxodo', testament: 'AT', totalChapters: 40, totalVerses: 1213, file: 'EXO.json' },
  { id: 'APO', name: 'Apocalipsis', testament: 'NT', totalChapters: 22, totalVerses: 404, file: 'APO.json' },
];

describe('getNextChapter', () => {
  it('advances within the same book', () => {
    expect(getNextChapter(BOOKS, 'GEN', 1)).toEqual({ bookId: 'GEN', chapter: 2 });
  });

  it('crosses into the next book after the last chapter', () => {
    expect(getNextChapter(BOOKS, 'GEN', 50)).toEqual({ bookId: 'EXO', chapter: 1 });
  });

  it('returns null past the last chapter of the last book (end of Bible)', () => {
    expect(getNextChapter(BOOKS, 'APO', 22)).toBeNull();
  });

  it('returns null for an unknown book', () => {
    expect(getNextChapter(BOOKS, 'XYZ', 1)).toBeNull();
  });
});

describe('getPrevChapter', () => {
  it('goes back within the same book', () => {
    expect(getPrevChapter(BOOKS, 'EXO', 5)).toEqual({ bookId: 'EXO', chapter: 4 });
  });

  it('crosses into the previous book before chapter 1', () => {
    expect(getPrevChapter(BOOKS, 'EXO', 1)).toEqual({ bookId: 'GEN', chapter: 50 });
  });

  it('returns null before GEN 1', () => {
    expect(getPrevChapter(BOOKS, 'GEN', 1)).toBeNull();
  });

  it('returns null for an unknown book', () => {
    expect(getPrevChapter(BOOKS, 'XYZ', 3)).toBeNull();
  });
});
