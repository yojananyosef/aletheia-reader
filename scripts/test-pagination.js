#!/usr/bin/env node

/**
 * Test script for pagination logic.
 * Simulates the buildPagination algorithm with different viewport sizes, toolbar states, and typography.
 *
 * Usage: node scripts/test-pagination.js [book] [chapter]
 * Example: node scripts/test-pagination.js NUM 1
 */

const fs = require('fs');
const path = require('path');

const bookArg = process.argv[2] || 'NUM';
const chapterArg = parseInt(process.argv[3] || '1', 10);

// Load data
const dataPath = path.join(__dirname, '..', 'public', 'json', `${bookArg}.json`);
if (!fs.existsSync(dataPath)) {
  console.error(`Data file not found: ${dataPath}`);
  process.exit(1);
}
const bookData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const chapter = bookData.chapters.find(ch => ch.chapter === chapterArg);
if (!chapter) {
  console.error(`Chapter ${chapterArg} not found in ${bookArg}`);
  process.exit(1);
}

const verses = chapter.verses;
const sections = chapter.sections || [];
console.log(`\n=== ${bookData.name} ${chapterArg} (${verses.length} verses, ${sections.length} sections) ===\n`);

// Test configurations
const configs = [
  { name: 'Desktop (Toolbar ON)', width: 1200, height: 800, fontSize: 18, lineHeight: 1.6, letterSpacing: 0.02, showToolbar: true, font: 'bookerly' },
  { name: 'Desktop Large Font (Toolbar ON)', width: 1200, height: 800, fontSize: 28, lineHeight: 2.5, letterSpacing: 0.02, showToolbar: true, font: 'opendyslexic' },
  { name: 'Mobile (Toolbar ON)', width: 375, height: 667, fontSize: 18, lineHeight: 1.6, letterSpacing: 0.02, showToolbar: true, font: 'bookerly' },
  { name: 'Mobile (Toolbar OFF / Immersion)', width: 375, height: 667, fontSize: 18, lineHeight: 1.6, letterSpacing: 0.02, showToolbar: false, font: 'bookerly' },
  { name: 'Mobile Extreme Font 28 OpenDyslexic (Toolbar ON)', width: 375, height: 667, fontSize: 28, lineHeight: 2.5, letterSpacing: 0.02, showToolbar: true, font: 'opendyslexic', bionic: true },
  { name: 'Mobile Extreme Font 28 OpenDyslexic (Toolbar OFF)', width: 375, height: 667, fontSize: 28, lineHeight: 2.5, letterSpacing: 0.02, showToolbar: false, font: 'opendyslexic', bionic: true },
];

const MAX_WORDS = 70;

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function splitAtWord(text, maxWords) {
  const words = text.split(/(\s+)/);
  let count = 0;
  let splitIdx = 0;
  for (let i = 0; i < words.length; i += 2) {
    count++;
    if (count > maxWords) {
      splitIdx = words.slice(0, i).join('').length;
      break;
    }
  }
  if (splitIdx === 0) splitIdx = text.length;
  return [text.slice(0, splitIdx), text.slice(splitIdx).trimStart()];
}

// Accurate height calculation simulation (accounting for font, section headers, superscripts, and bionic reading)
function estimatePageHeight(pageVerses, isFirstPage, containerWidth, fontSize, lineHeight, letterSpacing, font, bionic, sections) {
  if (pageVerses.length === 0) return 0;

  // OpenDyslexic has wider glyphs (~0.54 vs 0.46)
  const fontWidthFactor = font === 'opendyslexic' ? 0.54 : 0.46;
  const bionicFactor = bionic ? 1.08 : 1.0;
  const letterSpacingPx = (letterSpacing || 0.02) * fontSize;
  const charWidthPx = (fontSize * fontWidthFactor * bionicFactor) + letterSpacingPx;
  const maxCharsPerLine = Math.floor(Math.min(containerWidth, 60 * fontSize * 0.5) / charWidthPx);

  let sectionHeightTotal = 0;
  let totalChars = 0;

  for (let i = 0; i < pageVerses.length; i++) {
    const verse = pageVerses[i];
    const section = sections.find(s => String(s.beforeVerse) === String(verse.number));
    if (section && !verse._continuation) {
      // Section heading height
      const headingH = (i === 0 && isFirstPage) ? 32 : 44;
      sectionHeightTotal += headingH;
    }

    if (!verse._continuation) {
      totalChars += String(verse.number).length + 2; // Superscript width
    }
    totalChars += verse.text.length + 1;
  }

  // Simulate line breaks based on max characters per line
  const lines = Math.ceil(totalChars / maxCharsPerLine);
  const textHeight = lines * fontSize * lineHeight;

  return textHeight + sectionHeightTotal;
}

function buildPages(verses, availableHeight, containerWidth, config, sections) {
  const safetyBuffer = Math.min(16, Math.max(8, config.fontSize * 0.4));
  const effectiveAvailableHeight = Math.max(60, availableHeight - safetyBuffer);

  const queue = verses.map(v => ({ number: v.number, text: v.text }));
  const pages = [];
  let currentPageVerses = [];
  let currentWordsOnPage = 0;

  while (queue.length > 0) {
    const item = queue.shift();
    const itemWords = countWords(item.text);
    const isFirstPage = pages.length === 0;

    const candidatePage = [...currentPageVerses, item];
    const candidateWords = currentWordsOnPage + itemWords;
    const candidateHeight = estimatePageHeight(
      candidatePage,
      isFirstPage,
      containerWidth,
      config.fontSize,
      config.lineHeight,
      config.letterSpacing,
      config.font,
      config.bionic,
      sections
    );

    if (candidateHeight <= effectiveAvailableHeight && (currentPageVerses.length === 0 || candidateWords <= MAX_WORDS)) {
      currentPageVerses.push(item);
      currentWordsOnPage += itemWords;
      continue;
    }

    // Binary search max fitting words
    let low = 1;
    let high = itemWords - 1;
    let bestFitWords = 0;

    if (currentPageVerses.length > 0) {
      const allowed = MAX_WORDS - currentWordsOnPage;
      if (allowed < high) high = Math.max(0, allowed);
    }

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const [firstPart] = splitAtWord(item.text, mid);
      const testItem = { number: item.number, text: firstPart, _continuation: item._continuation };
      const testPage = [...currentPageVerses, testItem];
      const testHeight = estimatePageHeight(
        testPage,
        isFirstPage,
        containerWidth,
        config.fontSize,
        config.lineHeight,
        config.letterSpacing,
        config.font,
        config.bionic,
        sections
      );

      if (testHeight <= effectiveAvailableHeight) {
        bestFitWords = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (bestFitWords > 0) {
      const [firstPart, restPart] = splitAtWord(item.text, bestFitWords);
      currentPageVerses.push({ number: item.number, text: firstPart, _continuation: item._continuation });
      pages.push(currentPageVerses);
      currentPageVerses = [];
      currentWordsOnPage = 0;

      if (restPart.length > 0) {
        queue.unshift({ number: item.number, text: restPart, _continuation: true });
      }
    } else {
      if (currentPageVerses.length > 0) {
        pages.push(currentPageVerses);
        currentPageVerses = [];
        currentWordsOnPage = 0;
        queue.unshift(item);
      } else {
        const [firstPart, restPart] = splitAtWord(item.text, 1);
        pages.push([{ number: item.number, text: firstPart, _continuation: item._continuation }]);
        if (restPart.length > 0) {
          queue.unshift({ number: item.number, text: restPart, _continuation: true });
        }
      }
    }
  }

  if (currentPageVerses.length > 0) {
    pages.push(currentPageVerses);
  }

  return pages;
}

// Run tests across all configs
for (const config of configs) {
  console.log(`\n--- ${config.name} (${config.width}x${config.height}, font=${config.fontSize}, lh=${config.lineHeight}, font=${config.font}) ---`);

  const isMobile = config.width < 640;
  const toolbarHeight = config.showToolbar ? (isMobile ? 48 : 52) : 0;
  const footerHeight = config.showToolbar ? (isMobile ? 68 : 56) : (isMobile ? 28 : 24);
  const canvasPadding = isMobile ? 24 : 44;
  const headerTotal = isMobile ? 70 : 88;
  const availableHeight = config.height - toolbarHeight - footerHeight - canvasPadding - headerTotal;
  const containerWidth = config.width - (isMobile ? 28 : 64);

  console.log(`  Calculated Available Height: ${availableHeight}px (Viewport ${config.height}px - Toolbar ${toolbarHeight} - Footer ${footerHeight} - Padding ${canvasPadding} - Header ${headerTotal})`);

  const pages = buildPages(verses, availableHeight, containerWidth, config, sections);

  console.log(`  Total pages: ${pages.length}`);
  let totalOverflows = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const words = countWords(page.map(v => v.text).join(' '));
    const isFirstPage = i === 0;
    const height = Math.round(estimatePageHeight(page, isFirstPage, containerWidth, config.fontSize, config.lineHeight, config.letterSpacing, config.font, config.bionic, sections));
    const nums = page.map(v => `${v.number}${v._continuation ? ' (cont)' : ''}`).join(', ');
    const preview = page.map(v => v.text).join(' ').slice(0, 45).replace(/\n/g, ' ');
    const overflow = height > availableHeight ? ' ⚠️ OVERFLOW' : ' ✓ OK';
    if (height > availableHeight) totalOverflows++;
    console.log(`    P${i + 1}: [${nums}] words=${words} height=${height}/${availableHeight}px${overflow} "${preview}..."`);
  }

  if (totalOverflows === 0) {
    console.log(`  Result: PASSED (0 overflows)`);
  } else {
    console.log(`  Result: FAILED (${totalOverflows} overflows)`);
  }
}

console.log('\nDone.');
