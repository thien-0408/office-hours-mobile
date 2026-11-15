// Dev-only: dump the text items of __tests__/fixtures/TimeTable.pdf into a JSON fixture with
// pdfjs-dist (Node legacy build). Jest cannot run the native PdfBox extractor, so the parser
// tests read this file instead. Output follows the modules/pdf-text contract:
//   { pages: [{ width, height, items: [{ text, x, y }] }] }
// x/y are the PDF user-space glyph-run origin (y grows UP from the page bottom), the same
// numbers pdf.js puts in item.transform[4] / [5].
//
// pdf.js splits text at every font/space operation ("dụng di động", " ", "(CSW" ...), the native
// extractor yields whole words on a baseline instead. So the raw items are merged here with the
// same rule as modules/pdf-text (RunStripper): consecutive items on one baseline are joined while
// the gap is smaller than 0.8 x glyph height; blank items are dropped. Keep both in sync.
// Usage: node scripts/extract-pdf-fixture.mjs [input.pdf] [output.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input =
  process.argv[2] ?? path.join(root, '__tests__/fixtures/TimeTable.pdf');
const output =
  process.argv[3] ?? path.join(root, '__tests__/fixtures/TimeTable.items.json');

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const doc = await pdfjs.getDocument({
  data: new Uint8Array(readFileSync(input)),
}).promise;

const pages = [];
for (let n = 1; n <= doc.numPages; n++) {
  const page = await doc.getPage(n);
  const [x0, y0, x1, y1] = page.view;
  const content = await page.getTextContent();
  const items = [];
  let cur = null;
  for (const item of content.items) {
    if (!('str' in item) || item.str.trim().length === 0) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    const height = Math.max(item.height, 1);
    const gap = cur ? x - cur.endX : 0;
    if (cur && Math.abs(cur.y - y) < 1 && gap < height * 0.8 && x >= cur.x) {
      cur.text += (gap < height * 0.1 ? '' : ' ') + item.str.trim();
      cur.endX = x + item.width;
    } else {
      if (cur) items.push({ text: cur.text, x: cur.x, y: cur.y });
      cur = { text: item.str.trim(), x, y, endX: x + item.width };
    }
  }
  if (cur) items.push({ text: cur.text, x: cur.x, y: cur.y });
  pages.push({ width: x1 - x0, height: y1 - y0, items });
}
writeFileSync(output, JSON.stringify({ pages }, null, 1) + '\n');
const total = pages.reduce((a, p) => a + p.items.length, 0);
console.log(`${pages.length} page(s), ${total} items -> ${output}`);
