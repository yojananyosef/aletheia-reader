import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(path.join(root, 'app', 'globals.css'), 'utf8');

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

function blockVars(selector: string): Record<string, string> {
  const m = css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 's'));
  const vars: Record<string, string> = {};
  for (const [, k, v] of m?.[1].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g) ?? []) vars[k] = v;
  return vars;
}

function resolveTheme(theme: string): Record<string, string> {
  const rootVars = blockVars(':root');
  const out: Record<string, string> = {};
  const m = css.match(new RegExp(`\\.${theme}\\s*\\{([^}]*)\\}`, 's'));
  for (const [, k, v] of m?.[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g) ?? []) {
    const ref = v.trim().match(/var\((--[\w-]+)\)/);
    out[k] = ref ? rootVars[ref[1]] : v.trim();
  }
  return out;
}

function blend(fg: string, bg: string, opacity: number): string {
  const f = [0, 2, 4].map((i) => parseInt(fg.slice(i + 1, i + 3), 16));
  const b = [0, 2, 4].map((i) => parseInt(bg.slice(i + 1, i + 3), 16));
  return '#' + f.map((c, i) => Math.round(opacity * c + (1 - opacity) * b[i]).toString(16).padStart(2, '0')).join('');
}

const VERSE_SUPER_OPACITY =
  parseFloat(css.match(/\.verse-super\s*\{[^}]*opacity:\s*([\d.]+)/)?.[1] ?? 'NaN');
const AAA = 7.0;

describe('verse-super token', () => {
  it('opacity is declared in CSS', () => {
    expect(VERSE_SUPER_OPACITY).not.toBeNaN();
  });
});

describe.each([
  ['theme-pergamino', 'pergamino'],
  ['theme-noche', 'noche'],
  ['theme-sepia', 'sepia'],
])('%s text contrast (WCAG 1.4.6 AAA)', (themeClass) => {
  const t = resolveTheme(themeClass);
  it('body text >= 7:1', () => {
    expect(ratio(t['--reader-bg'], t['--reader-text'])).toBeGreaterThanOrEqual(AAA);
  });
  it('accent text >= 7:1', () => {
    expect(ratio(t['--reader-bg'], t['--reader-accent'])).toBeGreaterThanOrEqual(AAA);
  });
  it('accent solid foreground >= 7:1', () => {
    expect(ratio(t['--reader-accent'], t['--reader-accent-fg'])).toBeGreaterThanOrEqual(AAA);
  });
  it('muted text >= 7:1', () => {
    expect(ratio(t['--reader-bg'], t['--reader-muted'])).toBeGreaterThanOrEqual(AAA);
  });
  it(`verse numbers at opacity ${VERSE_SUPER_OPACITY} >= 7:1`, () => {
    const effective = blend(t['--reader-text'], t['--reader-bg'], VERSE_SUPER_OPACITY);
    expect(ratio(effective, t['--reader-bg'])).toBeGreaterThanOrEqual(AAA);
  });
});
