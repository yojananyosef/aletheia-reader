#!/usr/bin/env node

/**
 * Test script for pagination logic.
 * Simulates the buildPages algorithm with different viewport sizes and settings.
 *
 * Usage: node scripts/test-pagination.js [book] [chapter]
 * Example: node scripts/test-pagination.js GEN 1
 */

const fs = require('fs');
const path = require('path');

const bookArg = process.argv[2] || 'GEN';
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
console.log(`\n=== ${bookData.name} ${chapterArg} (${verses.length} verses) ===\n`);

// Test configurations
const configs = [
  { name: 'Desktop', width: 1200, height: 800, fontSize: 18, lineHeight: 1.6, letterSpacing: 0.02 },
  { name: 'Desktop Large Font', width: 1200, height: 800, fontSize: 28, lineHeight: 2.5, letterSpacing: 0.1 },
  { name: 'Tablet', width: 768, height: 1024, fontSize: 18, lineHeight: 1.6, letterSpacing: 0.02 },
  { name: 'Tablet Large Font', width: 768, height: 1024, fontSize: 28, lineHeight: 2.5, letterSpacing: 0.1 },
  { name: 'Mobile', width: 375, height: 667, fontSize: 18, lineHeight: 1.6, letterSpacing: 0.02 },
  { name: 'Mobile Large Font', width: 375, height: 667, fontSize: 28, lineHeight: 2.5, letterSpacing: 0.1 },
];

const MAX_WORDS = 50;

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

// Approximate height calculation (without DOM)
function estimateHeight(text, fontSize, lineHeight, containerWidth, letterSpacing = 0.02) {
  const letterSpacingPx = (letterSpacing || 0.02) * fontSize;
  const charWidthPx = fontSize * 0.46 + letterSpacingPx;
  const maxCharsPerLine = Math.floor(containerWidth / charWidthPx);
  // Simulate word wrapping more accurately
  const words = text.split(/\s+/).filter(Boolean);
  let lines = 1;
  let currentLineLen = 0;
  for (const word of words) {
    const wordLen = word.length;
    if (currentLineLen === 0) {
      // First word on line
      currentLineLen = wordLen;
    } else if (currentLineLen + 1 + wordLen <= maxCharsPerLine) {
      currentLineLen += 1 + wordLen;
    } else {
      lines++;
      currentLineLen = wordLen;
    }
  }
  return lines * fontSize * lineHeight;
}

function buildPages(verses, availableHeight, containerWidth, fontSize, lineHeight, letterSpacing) {
  const result = [[]];
  let curPage = 0;
  let curHeight = 0;
  let curWords = 0;

  const startNewPage = () => {
    result.push([]);
    curPage++;
    curHeight = 0;
    curWords = 0;
  };

  const queue = verses.map(v => ({ number: v.number, text: v.text }));

  while (queue.length > 0) {
    const item = queue.shift();
    const itemWords = countWords(item.text);
    const itemHeight = estimateHeight(item.text, fontSize, lineHeight, containerWidth, letterSpacing);

    // Fits on current page
    if (curHeight + itemHeight <= availableHeight && curWords + itemWords <= MAX_WORDS) {
      result[curPage].push(item);
      curHeight += itemHeight;
      curWords += itemWords;
      continue;
    }

    // Empty page → must put it here
    if (result[curPage].length === 0) {
      if (itemWords > MAX_WORDS) {
        const [first, rest] = splitAtWord(item.text, MAX_WORDS);
        result[curPage].push({ number: item.number, text: first });
        curHeight = estimateHeight(first, fontSize, lineHeight, containerWidth, letterSpacing);
        curWords = countWords(first);
        if (rest.length > 0) {
          queue.unshift({ number: item.number, text: rest });
        }
      } else if (itemHeight > availableHeight) {
        const targetHeight = availableHeight * 0.7;
        const fitWords = Math.max(3, Math.min(itemWords - 1, Math.floor(itemWords * (targetHeight / itemHeight))));
        const [first, rest] = splitAtWord(item.text, fitWords);
        result[curPage].push({ number: item.number, text: first });
        curHeight = estimateHeight(first, fontSize, lineHeight, containerWidth, letterSpacing);
        curWords = countWords(first);
        if (rest.length > 0) {
          queue.unshift({ number: item.number, text: rest });
        }
      } else {
        result[curPage].push(item);
        curHeight = itemHeight;
        curWords = itemWords;
      }
      continue;
    }

    // Page has content → try to fill remaining space
    const remainingWords = MAX_WORDS - curWords;
    const remainingHeight = availableHeight - curHeight;

    if (remainingWords > 10 && itemWords > remainingWords) {
      const [first, rest] = splitAtWord(item.text, remainingWords);
      const firstH = estimateHeight(first, fontSize, lineHeight, containerWidth, letterSpacing);
      if (curHeight + firstH <= availableHeight) {
        result[curPage].push({ number: item.number, text: first });
        curHeight += firstH;
        curWords += countWords(first);
        if (rest.length > 0) {
          queue.unshift({ number: item.number, text: rest });
        }
        continue;
      }
    }

    if (itemHeight > remainingHeight && remainingHeight > 30) {
      const targetHeight = remainingHeight * 0.7;
      const fitWords = Math.max(3, Math.min(itemWords - 1, Math.floor(itemWords * (targetHeight / itemHeight))));
      const [first, rest] = splitAtWord(item.text, fitWords);
      const firstH = estimateHeight(first, fontSize, lineHeight, containerWidth, letterSpacing);
      if (curHeight + firstH <= availableHeight && countWords(first) > 0 && rest.length > 0) {
        result[curPage].push({ number: item.number, text: first });
        curHeight += firstH;
        curWords += countWords(first);
        if (rest.length > 0) {
          queue.unshift({ number: item.number, text: rest });
        }
        continue;
      }
    }

    // Start new page
    startNewPage();
    queue.unshift(item);
  }

  return result.filter(p => p.length > 0);
}

// Verification: split any overflowing pages
function verifyPages(pages, availableHeight, fontSize, lineHeight, containerWidth, letterSpacing) {
  for (let iter = 0; iter < 5; iter++) {
    let anyBad = false;
    for (let pi = 0; pi < pages.length; pi++) {
      const page = pages[pi];
      const pageText = page.map(v => v.text).join(' ');
      const h = estimateHeight(pageText, fontSize, lineHeight, containerWidth, letterSpacing);
      if (h <= availableHeight) continue;
      anyBad = true;
      const lastVerse = page[page.length - 1];
      const remainingHeight = availableHeight * 0.75;
      const fitWords = Math.max(3, Math.floor(countWords(lastVerse.text) * (remainingHeight / h)));
      const [first, rest] = splitAtWord(lastVerse.text, fitWords);
      if (rest.length > 0 && countWords(first) > 0) {
        page[page.length - 1] = { number: lastVerse.number, text: first };
        pages.splice(pi + 1, 0, [{ number: lastVerse.number, text: rest }]);
        pi++;
      }
    }
    if (!anyBad) break;
  }
  return pages;
}

// Run tests
for (const config of configs) {
  console.log(`\n--- ${config.name} (${config.width}x${config.height}, font=${config.fontSize}, lh=${config.lineHeight}, ls=${config.letterSpacing}) ---`);

  const horizontalPadding = config.width < 640 ? 24 : config.width < 1024 ? 40 : 56;
  const containerWidth = config.width - horizontalPadding;
  // Simulate header (~70px) and some padding
  const availableHeight = config.height - 196;

  let pages = buildPages(verses, availableHeight, containerWidth, config.fontSize, config.lineHeight, config.letterSpacing);
  pages = verifyPages(pages, availableHeight, config.fontSize, config.lineHeight, containerWidth, config.letterSpacing);

  console.log(`Total pages: ${pages.length}`);
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageText = page.map(v => v.text).join(' ');
    const words = countWords(pageText);
    const height = Math.round(estimateHeight(pageText, config.fontSize, config.lineHeight, containerWidth));
    const nums = page.map(v => v.number).join(', ');
    const preview = pageText.slice(0, 60).replace(/\n/g, ' ');
    const overflow = height > availableHeight ? ' ⚠️ OVERFLOW' : '';
    console.log(`  P${i + 1}: [${nums}] words=${words} height=${height}/${availableHeight}${overflow} "${preview}..."`);
  }
}

console.log('\nDone.');
