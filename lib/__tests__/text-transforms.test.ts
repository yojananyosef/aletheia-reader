import { describe, it, expect } from 'vitest';
import { applyBionicReading, applySyllablePoints, applyReadingAids } from '../text-transforms';

describe('applyBionicReading', () => {
  it('wraps ~40% of each word in strong tags', () => {
    const result = applyBionicReading('Hola mundo');
    expect(result).toBe('<strong>Ho</strong>la <strong>mu</strong>ndo');
  });

  it('bolds entire word when 2 characters', () => {
    const result = applyBionicReading('el');
    expect(result).toBe('<strong>el</strong>');
  });

  it('bolds entire word when 1 character', () => {
    const result = applyBionicReading('a');
    expect(result).toBe('<strong>a</strong>');
  });

  it('leaves punctuation unchanged', () => {
    const result = applyBionicReading('—');
    expect(result).toBe('—');
  });

  it('handles accented characters', () => {
    const result = applyBionicReading('Dios');
    expect(result).toBe('<strong>Di</strong>os');
  });

  it('handles empty string', () => {
    expect(applyBionicReading('')).toBe('');
  });

  it('handles mixed text with leading/trailing punctuation', () => {
    const result = applyBionicReading('¡Hola, mundo!');
    expect(result).toBe('¡<strong>Ho</strong>la, <strong>mu</strong>ndo!');
  });

  it('bolds at least 1 character for 3-char words', () => {
    const result = applyBionicReading('que');
    expect(result).toBe('<strong>q</strong>ue');
  });

  it('handles parentheses around words', () => {
    const result = applyBionicReading('(Dios)');
    expect(result).toBe('(<strong>Di</strong>os)');
  });
});

describe('applySyllablePoints', () => {
  it('inserts mid-dots between syllables', () => {
    const result = applySyllablePoints('gracias');
    expect(result).toBe('gra·cias');
  });

  it('handles simple CV words', () => {
    const result = applySyllablePoints('casa');
    expect(result).toBe('ca·sa');
  });

  it('handles consonant clusters', () => {
    const result = applySyllablePoints('palabras');
    expect(result).toBe('pa·la·bras');
  });

  it('returns single-letter word unchanged', () => {
    const result = applySyllablePoints('a');
    expect(result).toBe('a');
  });

  it('handles single-syllable word (CVC)', () => {
    const result = applySyllablePoints('sol');
    expect(result).toBe('sol');
  });

  it('leaves punctuation unchanged', () => {
    const result = applySyllablePoints('—');
    expect(result).toBe('—');
  });

  it('handles empty string', () => {
    expect(applySyllablePoints('')).toBe('');
  });

  it('handles accented characters', () => {
    const result = applySyllablePoints('universo');
    expect(result).toBe('u·ni·ver·so');
  });

  it('handles single-syllable words (diphthong)', () => {
    // "Dios" has a diphthong (io) → single syllable
    const result = applySyllablePoints('Dios');
    expect(result).toBe('Dios');
  });

  it('handles short common words', () => {
    // "En" and "el" are single syllables
    const result = applySyllablePoints('En');
    expect(result).toBe('En');
  });

  it('preserves word order in sentence', () => {
    const result = applySyllablePoints('En el principio');
    expect(result).toContain('En');
    expect(result).toContain('el');
    expect(result).toContain('prin·ci·pio');
  });

  it('handles word ending in consonant cluster', () => {
    // "instante" → ins·tan·te
    const result = applySyllablePoints('instante');
    expect(result).toBe('ins·tan·te');
  });

  it('handles hiatus between strong vowels', () => {
    // "oído" → o·í·do (hiatus)
    const result = applySyllablePoints('oído');
    expect(result).toBe('o·í·do');
  });
});

describe('applyReadingAids (bionic + syllables combo)', () => {
  it('delegates to single-mode functions when only one mode is on', () => {
    expect(applyReadingAids('Hola mundo', { bionic: true })).toBe(applyBionicReading('Hola mundo'));
    expect(applyReadingAids('gracias casa', { syllables: true })).toBe(applySyllablePoints('gracias casa'));
    expect(applyReadingAids('Hola', {})).toBe('Hola');
  });

  it('keeps HTML well-formed: no mid-dot inside <strong>', () => {
    const result = applyReadingAids('gracias casa universo', { bionic: true, syllables: true });
    const strongContents = [...result.matchAll(/<strong>(.*?)<\/strong>/g)].map((m) => m[1]);
    expect(strongContents.length).toBe(3);
    for (const inner of strongContents) {
      expect(inner).not.toContain('·');
      expect(inner).not.toContain('<');
      expect(inner).not.toContain('>');
    }
    // Tags stay balanced, no tag text got syllabified (no stray < > inside output text)
    expect((result.match(/<strong>/g) || []).length).toBe((result.match(/<\/strong>/g) || []).length);
    expect(result.replace(/<\/?strong>/g, '')).not.toContain('<');
    expect(result.replace(/<\/?strong>/g, '')).not.toContain('>');
  });

  it('produces expected combo output', () => {
    expect(applyReadingAids('gracias', { bionic: true, syllables: true })).toBe(
      '<strong>gra</strong>·cias'
    );
    expect(applyReadingAids('casa', { bionic: true, syllables: true })).toBe(
      '<strong>ca</strong>·sa'
    );
  });

  it('handles punctuation and short words in combo mode', () => {
    const result = applyReadingAids('¡Hola, el sol!', { bionic: true, syllables: true });
    expect(result).toContain('¡<strong>Ho</strong>·la,');
    expect(result).toContain('<strong>el</strong>');
    expect(result).toContain('<strong>s</strong>ol!');
    expect((result.match(/<strong>/g) || []).length).toBe((result.match(/<\/strong>/g) || []).length);
  });
});
