// Timetable OCR parser (pure, no React Native imports).
//
// Input: the result of ML Kit text recognition (blocks -> lines -> elements with frames).
// Output: draft rows for the review screen. Two strategies:
//   1. Grid: day headers (Thứ 2 ... CN) define column bands, period/time labels in the left
//      column define row bands, every cell is assigned to (column, row-span).
//   2. List: "Thứ 2 07:30-09:00 Lập trình di động B11.306", one class per line.
// Anything guessed (OCR letter fixes, period -> time table, missing end time, merged-cell span,
// missing day/time/title) marks the row confidence 'low'.

export type Confidence = 'high' | 'low';

export interface ParsedScanRow {
  /** ISO 1..7 (Mon..Sun); 0 when no day could be determined (low confidence, user must pick). */
  dayOfWeek: number;
  /** "HH:mm", or '' when it could not be read. */
  startTime: string;
  endTime: string;
  title: string;
  room?: string;
  confidence: Confidence;
}

// Structural subset of @react-native-ml-kit/text-recognition's result.
export interface OcrFrame {
  left: number;
  top: number;
  width: number;
  height: number;
}
export interface OcrElement {
  text: string;
  frame?: OcrFrame;
}
export interface OcrLine {
  text: string;
  frame?: OcrFrame;
  elements?: OcrElement[];
}
export interface OcrBlock {
  text?: string;
  frame?: OcrFrame;
  lines: OcrLine[];
}
export interface OcrResult {
  text?: string;
  blocks: OcrBlock[];
}

// ---------------------------------------------------------------- small helpers

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
function fmtMin(total: number): string {
  const t = Math.max(0, Math.min(1439, total));
  return `${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`;
}
function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Period (tiết) -> clock time.
 * TODO: confirm EIU's real period times with the academic office. Placeholder: 45-minute
 * periods every 50 minutes from 07:30. Rows derived from this table are always 'low'.
 */
export const PERIOD_TIMES: Record<number, { start: string; end: string }> =
  (() => {
    const out: Record<number, { start: string; end: string }> = {};
    for (let p = 1; p <= 12; p++) {
      const s = 7 * 60 + 30 + (p - 1) * 50;
      out[p] = { start: fmtMin(s), end: fmtMin(s + 45) };
    }
    return out;
  })();

/** Assumed length when only a start time is known (minutes). */
export const DEFAULT_DURATION_MIN = 90;

/** NFC + collapsed whitespace. */
export function clean(s: string): string {
  return (s ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

/**
 * Lowercase, diacritics removed, đ -> d. Length-preserving for NFC input, so indexes in the
 * folded string are valid indexes in the original.
 */
export function fold(s: string): string {
  return s
    .split('')
    .map(ch => {
      if (ch === 'đ' || ch === 'Đ') {
        return 'd';
      }
      return ch.normalize('NFD')[0].toLowerCase();
    })
    .join('');
}

// ---------------------------------------------------------------- days

const NAME_TO_DAY: Record<string, number> = {
  hai: 1,
  ba: 2,
  tu: 3,
  nam: 4,
  sau: 5,
  bay: 6,
};
const EN_DAY: Record<string, number> = {
  mon: 1,
  tue: 2,
  tues: 2,
  wed: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  fri: 5,
  sat: 6,
  sun: 7,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

/** Day name at the very start of `text`. Returns ISO day and the matched length. */
export function matchDayPrefix(
  text: string,
): { dayOfWeek: number; length: number } | null {
  const f = fold(clean(text));
  let m = /^(?:thu|th|t)\s*\.?\s*([2-7])(?!\d)/.exec(f);
  if (m) {
    return { dayOfWeek: Number(m[1]) - 1, length: m[0].length };
  }
  m = /^thu\s*(hai|ba|tu|nam|sau|bay)(?![a-z])/.exec(f);
  if (m) {
    return { dayOfWeek: NAME_TO_DAY[m[1]], length: m[0].length };
  }
  m = /^(?:chu\s*nhat|cn)(?![a-z0-9])/.exec(f);
  if (m) {
    return { dayOfWeek: 7, length: m[0].length };
  }
  m =
    /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues|tue|wed|thurs|thur|thu|fri|sat|sun)(?![a-z0-9])/.exec(
      f,
    );
  if (m) {
    return { dayOfWeek: EN_DAY[m[1]], length: m[0].length };
  }
  return null;
}

// ---------------------------------------------------------------- times

const TIME_SRC =
  '(^|[^A-Za-z0-9])([0-2OoIl]?[0-9OoIl])\\s*[:;hH]\\s*([0-5OoIl][0-9OoIl])(?![A-Za-z0-9])';

function digits(s: string): string {
  return s.replace(/[Oo]/g, '0').replace(/[Il]/g, '1');
}

interface TimeHit {
  start: number;
  end: number;
  hhmm: string;
  corrected: boolean;
}

/** Times like 07:30, 7:30, 07h30, O7:30 (letter O for zero), 7;30. */
export function findTimes(text: string): TimeHit[] {
  const re = new RegExp(TIME_SRC, 'g');
  const hits: TimeHit[] = [];
  let m: RegExpExecArray | null = re.exec(text);
  while (m) {
    const hh = Number(digits(m[2]));
    const mm = Number(digits(m[3]));
    if (hh <= 23 && mm <= 59) {
      hits.push({
        start: m.index + m[1].length,
        end: m.index + m[0].length,
        hhmm: `${pad2(hh)}:${pad2(mm)}`,
        corrected: /[OoIl]/.test(m[2] + m[3]),
      });
    }
    m = re.exec(text);
  }
  return hits;
}

export interface TimeInfo {
  found: boolean;
  start: string | null;
  end: string | null;
  /** Something was inferred (OCR letter fix, period table, missing separator). */
  guessed: boolean;
  /** Text with the time / period expression removed. */
  rest: string;
}

function cut(text: string, from: number, to: number): string {
  return `${text.slice(0, from)} ${text.slice(to)}`;
}

/** Extract a time range / single time / "Tiết a-b" from free text. */
export function extractTimeInfo(
  text: string,
  opts: { allowPlainPeriod?: boolean } = {},
): TimeInfo {
  let rest = clean(text);
  let period: { a: number; b: number } | null = null;

  // Period expression first, so its digits are not read as anything else.
  const f = fold(rest);
  let pm =
    /(?:^|[^a-z0-9])(tiet\s*\.?\s*(\d{1,2})(?:\s*(?:[-–—~]|den|toi)\s*(\d{1,2}))?)(?![0-9])/.exec(
      f,
    );
  let from = -1;
  let to = -1;
  if (pm) {
    from = pm.index + pm[0].indexOf(pm[1]);
    to = from + pm[1].length;
  } else if (opts.allowPlainPeriod) {
    pm = /^\s*((\d{1,2})\s*[-–—~]\s*(\d{1,2}))\s*$/.exec(f);
    if (pm) {
      from = pm.index + pm[0].indexOf(pm[1]);
      to = from + pm[1].length;
    }
  }
  if (pm && from >= 0) {
    const a = Number(pm[2]);
    const b = pm[3] ? Number(pm[3]) : a;
    if (PERIOD_TIMES[a] && PERIOD_TIMES[b] && a <= b) {
      period = { a, b };
      rest = clean(cut(rest, from, to));
    }
  }

  const hits = findTimes(rest);
  if (hits.length >= 1) {
    const [a, b] = hits;
    if (b) {
      const between = fold(rest.slice(a.end, b.start)).trim();
      const sep = /^(?:[-–—~→]|den|toi|to)$/.test(between);
      const blank = between === '';
      if ((sep || blank) && toMin(b.hhmm) > toMin(a.hhmm)) {
        return {
          found: true,
          start: a.hhmm,
          end: b.hhmm,
          guessed: a.corrected || b.corrected || blank,
          rest: clean(cut(rest, a.start, b.end)),
        };
      }
    }
    return {
      found: true,
      start: a.hhmm,
      end: null,
      guessed: a.corrected,
      rest: clean(cut(rest, a.start, a.end)),
    };
  }
  if (period) {
    return {
      found: true,
      start: PERIOD_TIMES[period.a].start,
      end: PERIOD_TIMES[period.b].end,
      guessed: true,
      rest,
    };
  }
  return { found: false, start: null, end: null, guessed: false, rest };
}

// ---------------------------------------------------------------- room / title

const ROOM_SRC =
  '(^|[^A-Za-z0-9])([A-Za-z]{1,4}\\d{1,3}\\.[A-Za-z]{0,4}\\d{1,4}|[A-Za-z]{0,4}\\d{1,4}\\.[A-Za-z]{1,4}\\d{1,3})(?![A-Za-z0-9])';

/** Split "Lập trình di động B11.306" into title + room (306.B11, B11.306, LAB403.B08). */
export function splitTitleRoom(text: string): { title: string; room?: string } {
  let t = clean(text);
  let room: string | undefined;
  const m = new RegExp(ROOM_SRC).exec(t);
  if (m) {
    room = m[2].toUpperCase();
    const at = m.index + m[1].length;
    t = clean(cut(t, at, at + m[2].length));
  }
  // dangling "Phòng:" / "P." left in front of the removed room code
  const dm = /(?:^|\s)(phong|room|p)\s*[.:]?$/.exec(fold(t));
  if (dm) {
    t = clean(t.slice(0, dm.index));
  }
  t = t.replace(/^[\s\-–—,;:|/.]+|[\s\-–—,;:|/.]+$/g, '').trim();
  return room ? { title: t, room } : { title: t };
}

// ---------------------------------------------------------------- geometry

interface Token {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  h: number;
}

function token(text: string, f: OcrFrame): Token {
  return {
    text: clean(text),
    x0: f.left,
    y0: f.top,
    x1: f.left + f.width,
    y1: f.top + f.height,
    cx: f.left + f.width / 2,
    cy: f.top + f.height / 2,
    h: f.height,
  };
}

/** Tokens per OCR line (elements when they have frames, else the whole line). */
function tokensByLine(ocr: OcrResult): Token[][] {
  const out: Token[][] = [];
  for (const blk of ocr.blocks ?? []) {
    for (const l of blk.lines ?? []) {
      const els = l.elements ?? [];
      let toks: Token[] = [];
      if (els.length > 0 && els.every(e => e.frame)) {
        toks = els.map(e => token(e.text, e.frame as OcrFrame));
      } else if (l.frame) {
        toks = [token(l.text, l.frame)];
      }
      toks = toks.filter(t => t.text.length > 0);
      if (toks.length) {
        toks.sort((a, b) => a.x0 - b.x0);
        out.push(toks);
      }
    }
  }
  return out;
}

/**
 * Join elements of one OCR line into segments; a horizontal gap wider than twice the text
 * height starts a new segment (a line that runs across two grid cells is split there).
 */
function segmentLine(toks: Token[]): Token[] {
  const out: Token[] = [];
  let cur: Token[] = [];
  const flush = () => {
    if (cur.length === 0) {
      return;
    }
    const x0 = Math.min(...cur.map(t => t.x0));
    const x1 = Math.max(...cur.map(t => t.x1));
    const y0 = Math.min(...cur.map(t => t.y0));
    const y1 = Math.max(...cur.map(t => t.y1));
    out.push({
      text: clean(cur.map(t => t.text).join(' ')),
      x0,
      x1,
      y0,
      y1,
      cx: (x0 + x1) / 2,
      cy: (y0 + y1) / 2,
      h: y1 - y0,
    });
    cur = [];
  };
  for (const t of toks) {
    const prev = cur[cur.length - 1];
    if (prev && t.x0 - prev.x1 > 2 * Math.max(t.h, prev.h)) {
      flush();
    }
    cur.push(t);
  }
  flush();
  return out;
}

function median(xs: number[]): number {
  if (xs.length === 0) {
    return 0;
  }
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

interface TextLine {
  text: string;
  y0: number;
  y1: number;
  cy: number;
}
interface Cell {
  text: string;
  y0: number;
  y1: number;
  cy: number;
}

/** Visual text lines from loose tokens (same row = similar vertical centre). */
function visualLines(tokens: Token[]): TextLine[] {
  const sorted = [...tokens].sort((a, b) => a.cy - b.cy);
  const groups: { cy: number; h: number; toks: Token[] }[] = [];
  for (const t of sorted) {
    const g = groups[groups.length - 1];
    if (g && Math.abs(t.cy - g.cy) <= 0.6 * Math.max(t.h, g.h)) {
      g.toks.push(t);
      g.cy = g.toks.reduce((s, x) => s + x.cy, 0) / g.toks.length;
      g.h = Math.max(g.h, t.h);
    } else {
      groups.push({ cy: t.cy, h: t.h, toks: [t] });
    }
  }
  return groups.map(g => {
    g.toks.sort((a, b) => a.x0 - b.x0);
    return {
      text: clean(g.toks.map(t => t.text).join(' ')),
      y0: Math.min(...g.toks.map(t => t.y0)),
      y1: Math.max(...g.toks.map(t => t.y1)),
      cy: g.cy,
    };
  });
}

/** Multi-line titles: consecutive lines with a small vertical gap form one cell. */
function clusterCells(tokens: Token[], medH: number): Cell[] {
  const lines = visualLines(tokens).sort((a, b) => a.y0 - b.y0);
  const cells: { lines: TextLine[]; y0: number; y1: number }[] = [];
  for (const l of lines) {
    const c = cells[cells.length - 1];
    if (c && l.y0 - c.y1 < 0.6 * medH) {
      c.lines.push(l);
      c.y1 = Math.max(c.y1, l.y1);
    } else {
      cells.push({ lines: [l], y0: l.y0, y1: l.y1 });
    }
  }
  return cells.map(c => ({
    text: clean(c.lines.map(l => l.text).join(' ')),
    y0: c.y0,
    y1: c.y1,
    cy: (c.y0 + c.y1) / 2,
  }));
}

// ---------------------------------------------------------------- grid

interface Header {
  dayOfWeek: number;
  cx: number;
  cy: number;
  h: number;
  y1: number;
}

function findHeaders(lines: Token[][]): Header[] {
  const out: Header[] = [];
  for (const toks of lines) {
    let i = 0;
    while (i < toks.length) {
      let matched = false;
      for (let k = Math.min(2, toks.length - 1 - i); k >= 0; k--) {
        const slice = toks.slice(i, i + k + 1);
        const text = clean(slice.map(t => t.text).join(' '));
        const dm = matchDayPrefix(text);
        if (dm && /^[\s\d/\-.()]*$/.test(text.slice(dm.length))) {
          const x0 = slice[0].x0;
          const x1 = slice[slice.length - 1].x1;
          out.push({
            dayOfWeek: dm.dayOfWeek,
            cx: (x0 + x1) / 2,
            cy: median(slice.map(t => t.cy)),
            h: Math.max(...slice.map(t => t.h)),
            y1: Math.max(...slice.map(t => t.y1)),
          });
          i += k + 1;
          matched = true;
          break;
        }
      }
      if (!matched) {
        i++;
      }
    }
  }
  return out;
}

/** The headers sharing one horizontal band with the most distinct days (>= 2). */
function pickHeaderRow(headers: Header[]): Header[] | null {
  let best: Header[] | null = null;
  for (const h of headers) {
    const tol = Math.max(h.h, 8) * 0.8;
    const seen = new Set<number>();
    const group: Header[] = [];
    for (const o of [...headers].sort((a, b) => a.cx - b.cx)) {
      if (Math.abs(o.cy - h.cy) <= tol && !seen.has(o.dayOfWeek)) {
        seen.add(o.dayOfWeek);
        group.push(o);
      }
    }
    if (
      group.length >= 2 &&
      (!best ||
        group.length > best.length ||
        (group.length === best.length &&
          median(group.map(g => g.cy)) < median(best.map(g => g.cy))))
    ) {
      best = group;
    }
  }
  return best;
}

interface TimeLabel {
  cy: number;
  start: string;
  end: string;
  guessed: boolean;
  top: number;
  bottom: number;
}

function buildLabels(cells: Cell[]): TimeLabel[] {
  const raw: { cell: Cell; info: TimeInfo }[] = [];
  for (const c of cells) {
    const info = extractTimeInfo(c.text, { allowPlainPeriod: true });
    if (info.found && info.start) {
      raw.push({ cell: c, info });
    }
  }
  raw.sort((a, b) => a.cell.cy - b.cell.cy);
  const labels: TimeLabel[] = raw.map((r, i) => {
    let end = r.info.end;
    let guessed = r.info.guessed;
    const start = r.info.start as string;
    if (!end) {
      const next = raw[i + 1]?.info.start;
      if (next && toMin(next) > toMin(start)) {
        end = next;
      } else {
        end = fmtMin(toMin(start) + DEFAULT_DURATION_MIN);
        guessed = true;
      }
    }
    return { cy: r.cell.cy, start, end, guessed, top: 0, bottom: 0 };
  });
  labels.forEach((l, i) => {
    if (i > 0) {
      l.top = (labels[i - 1].cy + l.cy) / 2;
    }
    if (i < labels.length - 1) {
      l.bottom = (l.cy + labels[i + 1].cy) / 2;
    }
  });
  // outer rows: assume the same height as their inner neighbour edge (symmetric about the label)
  if (labels.length === 0) {
    return labels;
  }
  const last = labels.length - 1;
  labels[0].top = labels[0].cy - (labels[0].bottom - labels[0].cy || 60);
  if (last > 0) {
    labels[last].bottom = labels[last].cy + (labels[last].cy - labels[last].top);
  } else {
    labels[0].bottom = labels[0].cy + 60;
  }
  return labels;
}

/** Rows (labels) a cell occupies: overlap >= 50% of a row, or sitting on a row boundary. */
function coveredRows(
  cell: Cell,
  labels: TimeLabel[],
): { rows: TimeLabel[]; spanGuess: boolean } {
  let idx = labels.findIndex(l => cell.cy >= l.top && cell.cy < l.bottom);
  if (idx < 0) {
    idx = cell.cy < labels[0].top ? 0 : labels.length - 1;
  }
  const set = new Set<number>([idx]);
  let spanGuess = false;
  labels.forEach((l, i) => {
    const overlap = Math.min(cell.y1, l.bottom) - Math.max(cell.y0, l.top);
    if (overlap >= 0.5 * (l.bottom - l.top)) {
      set.add(i);
    }
  });
  const cur = labels[idx];
  const t = (cell.cy - cur.top) / Math.max(1, cur.bottom - cur.top);
  if (t < 0.25 && idx > 0) {
    set.add(idx - 1);
    spanGuess = true;
  } else if (t > 0.75 && idx < labels.length - 1) {
    set.add(idx + 1);
    spanGuess = true;
  }
  const idxs = [...set].sort((a, b) => a - b);
  // keep the contiguous run that starts at the first index
  const run: number[] = [];
  for (const v of idxs) {
    if (run.length === 0 || v === run[run.length - 1] + 1) {
      run.push(v);
    }
  }
  return {
    rows: run.map(i => labels[i]),
    spanGuess: spanGuess || run.length > 1,
  };
}

function parseGrid(lines: Token[][]): ParsedScanRow[] | null {
  const headerRow = pickHeaderRow(findHeaders(lines));
  if (!headerRow) {
    return null;
  }
  const cols = [...headerRow].sort((a, b) => a.cx - b.cx);
  const pitches: number[] = [];
  for (let i = 1; i < cols.length; i++) {
    const dd = cols[i].dayOfWeek - cols[i - 1].dayOfWeek;
    if (dd > 0) {
      pitches.push((cols[i].cx - cols[i - 1].cx) / dd);
    }
  }
  const pitch =
    median(pitches) ||
    median(cols.slice(1).map((c, i) => c.cx - cols[i].cx)) ||
    100;
  const leftEdge = cols[0].cx - pitch / 2;
  const rightEdge = cols[cols.length - 1].cx + pitch * 0.75;
  const bounds = cols.slice(1).map((c, i) => (c.cx + cols[i].cx) / 2);
  const headerCy = median(cols.map(c => c.cy));
  const headerH = Math.max(...cols.map(c => c.h));

  const body: Token[] = [];
  for (const toks of lines) {
    for (const t of segmentLine(toks)) {
      if (t.cy > headerCy + headerH * 0.6) {
        body.push(t);
      }
    }
  }
  if (body.length === 0) {
    return [];
  }
  const medH = median(body.map(t => t.h)) || 10;

  const labelToks: Token[] = [];
  const colToks: Token[][] = cols.map(() => []);
  for (const t of body) {
    if (t.cx < leftEdge) {
      labelToks.push(t);
    } else if (t.cx <= rightEdge) {
      let c = 0;
      while (c < bounds.length && t.cx >= bounds[c]) {
        c++;
      }
      colToks[c].push(t);
    }
  }

  const labels = buildLabels(clusterCells(labelToks, medH));

  const out: ParsedScanRow[] = [];
  cols.forEach((col, ci) => {
    for (const cell of clusterCells(colToks[ci], medH)) {
      const inline = extractTimeInfo(cell.text);
      const { title, room } = splitTitleRoom(inline.rest);
      if (!title && !room) {
        continue;
      }
      let start = '';
      let end = '';
      let low = inline.guessed;
      if (inline.found && inline.start && inline.end) {
        start = inline.start;
        end = inline.end;
      } else if (labels.length > 0) {
        const { rows, spanGuess } = coveredRows(cell, labels);
        start = rows[0].start;
        end = rows[rows.length - 1].end;
        low = low || spanGuess || rows.some(r => r.guessed);
        if (inline.found && inline.start) {
          start = inline.start;
          low = true;
        }
      } else {
        start = inline.start ?? '';
        low = true;
      }
      if (!start || !end || toMin(end) <= toMin(start)) {
        low = true;
      }
      if (title.length < 3) {
        low = true;
      }
      out.push({
        dayOfWeek: col.dayOfWeek,
        startTime: start,
        endTime: end,
        title,
        ...(room ? { room } : {}),
        confidence: low ? 'low' : 'high',
      });
    }
  });
  return out;
}

// ---------------------------------------------------------------- list

/** Plain text lines in reading order; lines on the same visual row are joined. */
function readingLines(ocr: OcrResult): string[] {
  const lines: OcrLine[] = [];
  for (const b of ocr.blocks ?? []) {
    for (const l of b.lines ?? []) {
      lines.push(l);
    }
  }
  if (lines.length === 0) {
    return (ocr.text ?? '').split(/\r?\n/);
  }
  if (!lines.every(l => l.frame)) {
    return lines.map(l => l.text);
  }
  const items = lines
    .map(l => ({ text: l.text, f: l.frame as OcrFrame }))
    .sort((a, b) => a.f.top + a.f.height / 2 - (b.f.top + b.f.height / 2));
  const groups: { cy: number; h: number; items: typeof items }[] = [];
  for (const it of items) {
    const cy = it.f.top + it.f.height / 2;
    const g = groups[groups.length - 1];
    if (g && Math.abs(cy - g.cy) <= 0.5 * Math.max(it.f.height, g.h)) {
      g.items.push(it);
    } else {
      groups.push({ cy, h: it.f.height, items: [it] });
    }
  }
  return groups.map(g =>
    g.items
      .sort((a, b) => a.f.left - b.f.left)
      .map(i => i.text)
      .join(' '),
  );
}

function parseList(rawLines: string[]): ParsedScanRow[] {
  const out: ParsedScanRow[] = [];
  let day = 0;
  let pending: ParsedScanRow | null = null;

  for (const raw of rawLines) {
    let text = clean(raw).replace(/^\d{1,2}\s*[.)]\s+/, '');
    if (!text) {
      continue;
    }
    const dm = matchDayPrefix(text);
    if (dm) {
      day = dm.dayOfWeek;
      text = clean(text.slice(dm.length).replace(/^[\s:,\-–.]+/, ''));
      pending = null;
      if (!text) {
        continue;
      }
    }
    const info = extractTimeInfo(text);
    if (!info.found) {
      // a title on the line after a "day + time" line
      if (pending && !pending.title) {
        const { title, room } = splitTitleRoom(text);
        pending.title = title;
        if (room && !pending.room) {
          pending.room = room;
        }
        if (title.length >= 3) {
          pending = null;
        }
      }
      continue;
    }
    const { title, room } = splitTitleRoom(info.rest);
    const complete = Boolean(info.start && info.end);
    const row: ParsedScanRow = {
      dayOfWeek: day,
      startTime: info.start ?? '',
      endTime: info.end ?? '',
      title,
      ...(room ? { room } : {}),
      confidence: 'high',
    };
    if (!day || !complete || info.guessed) {
      row.confidence = 'low';
    }
    out.push(row);
    pending = title ? null : row;
  }
  for (const r of out) {
    if (r.title.length < 3) {
      r.confidence = 'low';
    }
  }
  return out;
}

// ---------------------------------------------------------------- entry

function finalize(rows: ParsedScanRow[]): ParsedScanRow[] {
  const seen = new Set<string>();
  const unique = rows.filter(r => {
    const key = `${r.dayOfWeek}|${r.startTime}|${r.endTime}|${r.title.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
  return unique.sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek ||
      (a.startTime || '99').localeCompare(b.startTime || '99') ||
      a.title.localeCompare(b.title),
  );
}

/** ML Kit result -> draft rows (never throws on odd input; returns [] when nothing is found). */
export function parseTimetable(
  ocr: OcrResult | null | undefined,
): ParsedScanRow[] {
  if (!ocr) {
    return [];
  }
  const lines = tokensByLine(ocr);
  if (lines.length > 0) {
    const grid = parseGrid(lines);
    if (grid && grid.length > 0) {
      return finalize(grid);
    }
  }
  return finalize(parseList(readingLines(ocr)));
}
