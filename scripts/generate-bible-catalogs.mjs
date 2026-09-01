#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const biblesRoot = 'public/data/bibles';
const manifestPath = path.join(biblesRoot, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const spanish = manifest.filter((m) => m.language === 'es');

// Canonical order from gateway BibleBooks (66 protestant) + deuteros after MAL
const legacyBiblePath = 'public/json/bible.json';
let canonicalOrder = [];
try {
  const legacy = JSON.parse(fs.readFileSync(legacyBiblePath, 'utf-8'));
  canonicalOrder = legacy.books.map((b) => b.id);
} catch {
  canonicalOrder = [];
}
const deutro = ['TOB', 'JDT', 'WIS', 'SIR', 'BAR', '1MA', '2MA'];
const platenseOrder = [];
for (const id of canonicalOrder) {
  platenseOrder.push(id);
  if (id === 'MAL') platenseOrder.push(...deutro);
}

for (const entry of spanish) {
  const id = entry.id;
  const dir = path.join(biblesRoot, id);
  const allFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'bible.json');
  const filesSet = new Set(allFiles.map((f) => f.replace('.json', '')));
  const order = id === 'SpaPlatense' ? platenseOrder : canonicalOrder;
  const orderedCodes = order.length > 0 ? order.filter((c) => filesSet.has(c)) : [...filesSet].sort();
  // Append any extra not in canonical
  for (const f of filesSet) if (!orderedCodes.includes(f)) orderedCodes.push(f);

  const books = [];
  let totalChapters = 0;
  let totalVerses = 0;
  for (const code of orderedCodes) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, `${code}.json`), 'utf-8'));
    const bookCode = data.bookCode || code;
    const bookName = data.bookName || bookCode;
    const testament = data.testament || 'AT';
    const chapters = data.chapters;
    let chCount = 0;
    let vCount = 0;
    if (Array.isArray(chapters)) {
      chCount = chapters.length;
      for (const c of chapters) vCount += (c.verses || []).length;
    } else if (chapters && typeof chapters === 'object') {
      chCount = Object.keys(chapters).length;
      for (const k of Object.keys(chapters)) vCount += (chapters[k].verses || []).length;
    }
    totalChapters += chCount;
    totalVerses += vCount;
    books.push({ id: bookCode, name: bookName, testament, totalChapters: chCount, totalVerses: vCount, file: `${bookCode}.json` });
  }
  const bibleJson = {
    meta: {
      translation: entry.name,
      translationId: entry.id,
      language: entry.language,
      languageName: entry.languageName || 'Español',
      copyright: entry.copyright || '',
      license: entry.license || entry.copyright || '',
      licenseUrl: entry.licenseUrl || '',
      year: entry.year || '',
      source: entry.source || '',
      totalBooks: books.length,
      totalChapters,
      totalVerses,
    },
    books,
  };
  fs.writeFileSync(path.join(dir, 'bible.json'), JSON.stringify(bibleJson, null, 2));
  console.log(`Generated ${id}/bible.json — ${books.length} books, ${totalChapters} chapters`);
}
console.log('Done');
