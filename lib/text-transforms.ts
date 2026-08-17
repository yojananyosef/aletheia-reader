/**
 * Text transformation utilities for dyslexia reading aids.
 *
 * - applyBionicReading: bold prefix (~40%) of each word for saccadic fixation
 * - applySyllablePoints: insert mid-dot (·) at Spanish syllable boundaries
 */

// --- Bionic Reading ---

/**
 * Wraps the first ~40% of each word in <strong> tags to create saccadic fixation anchors.
 * Words of 1–2 characters are fully bolded. Punctuation-only tokens are left unchanged.
 */
export function applyBionicReading(text: string): string {
  return text.replace(/(\S+)/g, (word) => {
    // Skip pure punctuation/digit tokens (e.g. "—", ".", ",", ":", "¡", "!")
    if (/^[\p{P}\p{S}\d]+$/u.test(word)) return word;

    // Strip leading and trailing punctuation before counting letters
    const match = word.match(/^([\p{P}\p{S}]*)(.*?)([\p{P}\p{S}]*)$/u);
    if (!match) return word;

    const leading = match[1];
    const core = match[2];
    const trailing = match[3];

    if (core.length === 0) return word;
    if (core.length <= 2) {
      return `${leading}<strong>${core}</strong>${trailing}`;
    }

    const letters = [...core];
    const boldLen = Math.max(1, Math.round(letters.length * 0.4));
    const bold = letters.slice(0, boldLen).join('');
    const rest = letters.slice(boldLen).join('');
    return `${leading}<strong>${bold}</strong>${rest}${trailing}`;
  });
}

// --- Syllable Points (Spanish) ---

const VOWELS = 'aeiouáéíóúü';
const STRONG_VOWELS = 'aáeéoó';
const WEAK_VOWELS = 'iíuúü';

function isVowel(ch: string): boolean {
  return VOWELS.includes(ch.toLowerCase());
}

function isStrong(ch: string): boolean {
  return STRONG_VOWELS.includes(ch.toLowerCase());
}

function isWeak(ch: string): boolean {
  return WEAK_VOWELS.includes(ch.toLowerCase());
}

function hasAccent(ch: string): boolean {
  return ch !== ch.normalize('NFD').charAt(0);
}

/**
 * Splits a Spanish word into syllables using standard phonological rules.
 *
 * Key rules for consonant-vowel groupings:
 * - A single consonant between vowels joins the next syllable (CV.CVCV → CV.CVCV)
 * - Two consonants between vowels split: first stays, second joins next (CVC.CV)
 *   except for "bl", "br", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr", "tl", "tr"
 *   which stay together with the following vowel
 * - Vowel clusters: strong+strong = hiatus (split), weak+strong or strong+weak = diphthong
 */
function splitSyllables(word: string): string[] {
  const chars = [...word];
  const len = chars.length;
  if (len <= 1) return [word];

  // Build vowel/consonant pattern string
  const p = chars.map((c) => (isVowel(c) ? 'V' : 'C'));
  const syllables: string[] = [];
  let i = 0;

  while (i < len) {
    let end = i;

    if (p[i] === 'V') {
      // --- Vowel onset ---
      end = i + 1;
      // Consume vowel cluster (diphthong/triphthong)
      while (end < len && p[end] === 'V') {
        const a = chars[end - 1];
        const b = chars[end];
        // An accented weak vowel after a strong vowel forces hiatus (e.g. "oído")
        if (hasAccent(b) && isWeak(b) && isStrong(a)) {
          break;
        }
        if (isWeak(a) && isWeak(b)) {
          // weak+weak = diphthong, keep together
          end++;
        } else if (isWeak(a) || isWeak(b)) {
          // weak+strong or strong+weak = diphthong, keep together
          end++;
        } else {
          // strong+strong = hiatus, split here
          break;
        }
      }
      // Now end is at a consonant or end of word

      // If consonants follow, decide how many to include
      if (end < len && p[end] === 'C') {
        // Look ahead to next vowel group
        let consEnd = end;
        while (consEnd < len && p[consEnd] === 'C') {
          consEnd++;
        }
        const consCount = consEnd - end;

        if (consEnd >= len) {
          // Consonants at end of word: include all in this syllable
          end = len;
        } else if (consCount === 1) {
          // Single consonant goes with next syllable
          // end stays at current vowel group end
        } else {
          // Multiple consonants: check for "bl/br/cr/..." clusters
          const pair = chars.slice(end, end + 2).join('').toLowerCase();
          const liquidClusters = ['bl', 'br', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tl', 'tr'];

          if (consCount >= 2 && liquidClusters.includes(pair)) {
            // Liquid cluster + following vowel all go with next syllable
            // Only include the consonants that are NOT part of the cluster
            // Actually: the cluster goes with the next vowel → split before cluster
            // end stays at current vowel group end
          } else {
            // Split: all but last consonant stay with current syllable
            end = consEnd - 1;
          }
        }
      }
    } else {
      // --- Consonant onset ---
      end = i + 1;
      // Consume consonants up to first vowel
      while (end < len && p[end] === 'C') {
        end++;
      }
      // Now end is at a vowel or end of word

      if (end < len && p[end] === 'V') {
        // Include the next vowel cluster
        let vowelEnd = end + 1;
        while (vowelEnd < len && p[vowelEnd] === 'V') {
          const a = chars[vowelEnd - 1];
          const b = chars[vowelEnd];
          if (hasAccent(b) && isWeak(b) && isStrong(a)) {
            break;
          }
          if (isWeak(a) && isWeak(b)) {
            vowelEnd++;
          } else if (isWeak(a) || isWeak(b)) {
            vowelEnd++;
          } else {
            break;
          }
        }

        // Now check consonants after vowel cluster
        if (vowelEnd < len && p[vowelEnd] === 'C') {
          let consEnd = vowelEnd;
          while (consEnd < len && p[consEnd] === 'C') {
            consEnd++;
          }
          const consCount = consEnd - vowelEnd;

          if (consEnd >= len) {
            // All remaining consonants go with this syllable
            end = len;
          } else if (consCount === 1) {
            // Single consonant goes with next syllable
            end = vowelEnd;
          } else {
            const pair = chars.slice(vowelEnd, vowelEnd + 2).join('').toLowerCase();
            const liquidClusters = ['bl', 'br', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tl', 'tr'];
            if (liquidClusters.includes(pair)) {
              end = vowelEnd; // cluster + next vowel go together
            } else {
              end = consEnd - 1;
            }
          }
        } else {
          end = vowelEnd;
        }
      }
    }

    // Safety: always advance
    if (end <= i) end = i + 1;

    syllables.push(chars.slice(i, end).join(''));
    i = end;
  }

  return syllables;
}

/**
 * Inserts mid-dot (·) syllable separators into a Spanish word.
 */
export function applySyllablePoints(text: string): string {
  return text.replace(/(\S+)/g, (word) => {
    // Skip pure punctuation tokens
    if (/^[\p{P}\p{S}\d]+$/u.test(word)) return word;
    if ([...word].length <= 1) return word;

    const syllables = splitSyllables(word);
    if (syllables.length <= 1) return word;
    return syllables.join('·');
  });
}
