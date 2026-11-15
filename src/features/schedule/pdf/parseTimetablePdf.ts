// Parser of the official AAO timetable PDF (pure, no React Native imports).
//
// Behaviour-preserving port of the web app's lib/timetable/parse-pdf.ts: same regexes, same
// day-column + room-anchor clustering, same "Thứ 2" ruler fix. The only difference is the input:
// the web gets text items from pdf.js, the app gets them from the native `pdf-text` module.
// Both give { text, x, y } with x/y in PDF user space (y grows UP), so the algorithm is shared.
//
// The Monday ("Thứ 2") fix: an item's day column is the closest day-column centre by absolute
// distance, and anything left of `dayCols[0].x - 30` (the time-axis ruler) is dropped before
// clustering. Both parts are required together.

import type { ParsedTimetableRow } from '../../../api/domainTypes';

export interface TextItem {
  text: string;
  x: number;
  y: number;
}

export interface TimetableMetadata {
  name: string | null;
  semester: string | null;
}

export interface ParsedTimetableResult {
  metadata: TimetableMetadata;
  rows: ParsedTimetableRow[];
  /** How many "Thứ N" / "Chủ Nhật" header columns were found (0 = not the AAO template). */
  dayColumns: number;
}

export const DAY_NAMES = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ Nhật',
];

const DAY_NAME_TO_INDEX: Record<string, number> = {
  'Thứ 2': 1,
  'Thứ 3': 2,
  'Thứ 4': 3,
  'Thứ 5': 4,
  'Thứ 6': 5,
  'Thứ 7': 6,
  'Chủ Nhật': 7,
};

function cleanStr(str: string | undefined | null): string {
  if (!str) {
    return '';
  }
  return str
    .normalize('NFC')
    .replace(/[\uE000-\uF8FF]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDayByX(
  x: number,
  dayCols: { name: string; x: number }[],
  rulerMaxX: number,
): string | null {
  if (dayCols.length === 0) {
    return null;
  }
  if (x < rulerMaxX) {
    return null; // ruler-column exclusion
  }
  let closestDay = dayCols[0].name;
  let minDiff = Math.abs(x - dayCols[0].x);
  for (let i = 1; i < dayCols.length; i++) {
    const diff = Math.abs(x - dayCols[i].x);
    if (diff < minDiff) {
      minDiff = diff;
      closestDay = dayCols[i].name;
    }
  }
  return closestDay;
}

/** Items of every page (already in PDF user space) -> metadata + rows, like the web parser. */
export function parseTimetableItems(
  rawItems: TextItem[],
): ParsedTimetableResult {
  const allTextItems: TextItem[] = [];
  for (const item of rawItems) {
    const text = cleanStr(item.text);
    if (!text) {
      continue;
    }
    allTextItems.push({ text, x: Math.round(item.x), y: Math.round(item.y) });
  }

  // 1. Metadata: student / semester banner, informational only.
  const fullString = allTextItems.map(i => i.text).join(' ');
  const nameMatch = fullString.match(/Sinh\s*viên:\s*([^|\r\n]+)/i);
  const semesterMatch = fullString.match(
    /(Học\s*kỳ\s*\d+\s*-\s*Năm\s*học\s*[\d\s-]+)/i,
  );
  const metadata: TimetableMetadata = {
    name: nameMatch ? nameMatch[1].trim() : null,
    semester: semesterMatch ? semesterMatch[1].trim() : null,
  };

  // 2. Day-column X centres from the "Thứ N" / "Chủ Nhật" header labels.
  const dayCols: { name: string; x: number }[] = [];
  for (const day of DAY_NAMES) {
    const found = allTextItems.filter(item => item.text.startsWith(day));
    if (found.length > 0) {
      const avgX = found.reduce((acc, cur) => acc + cur.x, 0) / found.length;
      dayCols.push({ name: day, x: avgX });
    }
  }
  dayCols.sort((a, b) => a.x - b.x);
  const rulerMaxX = dayCols.length > 0 ? dayCols[0].x - 30 : -Infinity;

  // 2b. Calendar date of each day column header ("Thứ 2 (13/07)", "(13/07)", "13/07").
  const dayDateByName: Record<string, string> = {};
  for (const item of allTextItems) {
    for (const day of DAY_NAMES) {
      if (item.text.startsWith(day) || item.text.includes(day)) {
        const directMatch = item.text.match(
          /\(?\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*\)?/,
        );
        if (directMatch && !dayDateByName[day]) {
          dayDateByName[day] = directMatch[1];
        }
      }
    }
  }
  const dateHeaderItems = allTextItems.filter(item =>
    /^\(?\s*\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\s*\)?$/.test(item.text),
  );
  for (const item of dateHeaderItems) {
    if (dayCols.length === 0) {
      break;
    }
    let closestDay = dayCols[0].name;
    let minDiff = Math.abs(item.x - dayCols[0].x);
    for (const col of dayCols) {
      const diff = Math.abs(item.x - col.x);
      if (diff < minDiff) {
        minDiff = diff;
        closestDay = col.name;
      }
    }
    if (!dayDateByName[closestDay]) {
      const dateMatch = item.text.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
      if (dateMatch) {
        dayDateByName[closestDay] = dateMatch[1];
      }
    }
  }

  // 3. Resolve each item's day column up front (ruler excluded).
  const validItems = allTextItems
    .map(item => ({ ...item, day: getDayByX(item.x, dayCols, rulerMaxX) }))
    .filter((item): item is TextItem & { day: string } => item.day !== null);

  // 4. Anchor each class block on "Phòng:", cluster nearby text of the same column.
  const roomAnchors = validItems.filter(item => item.text.includes('Phòng:'));
  const rows: ParsedTimetableRow[] = [];

  for (const anchor of roomAnchors) {
    const day = anchor.day;
    const cluster = validItems.filter(
      item => item.day === day && Math.abs(item.y - anchor.y) <= 110,
    );
    cluster.sort((a, b) => b.y - a.y);
    const clusterText = cluster.map(i => i.text).join(' ');

    let startTime = '';
    let endTime = '';
    const timeMatches = [
      ...clusterText.matchAll(
        /([0-2]?\d:[0-5]\d)\s*(?:->|-)\s*([0-2]?\d:[0-5]\d)/g,
      ),
    ];
    if (timeMatches.length > 0) {
      startTime = timeMatches[0][1];
      endTime = timeMatches[0][2];
    }

    let subjectCode = 'N/A';
    let subjectName = 'Chưa nhận diện';

    // LAB/ROOM/PHONG prefixes (e.g. "LAB405") are 3 letters + 3 digits too: not a subject code.
    const codeMatch = clusterText.match(
      /\b(?!(?:LAB|ROOM|PHONG)\b)([A-Z]{3,4}\s*\d{3})\b/i,
    );
    if (codeMatch) {
      subjectCode = codeMatch[1].toUpperCase();
    }

    const namePartMatch = clusterText.match(
      /^(.+?)(?=\s*\(\s*[A-Z]{3,4}\s*\d{3}\s*\)|\s*\b[A-Z]{3,4}\s*\d{3}\b|\s*Nhóm:|\s*Phòng:)/i,
    );
    if (namePartMatch) {
      subjectName = namePartMatch[1].trim();
    } else {
      const firstItem = cluster.find(
        i => !i.text.startsWith('Nhóm:') && !i.text.startsWith('Phòng:'),
      );
      if (firstItem) {
        subjectName = firstItem.text
          .replace(/\(\s*[A-Z]{3,4}\s*\d{3}\s*\)/gi, '')
          .trim();
      }
    }

    let group = 'N/A';
    const groupMatch = clusterText.match(/Nhóm:\s*([A-Za-z0-9]+)/i);
    if (groupMatch) {
      group = groupMatch[1];
    }

    let room = 'ONLINE / Chưa rõ';
    const roomMatch = clusterText.match(
      /Phòng:\s*([A-Za-z0-9.\-\s]+?)(?=\s*GV:|\s*Lab|\s*Phòng|\s*ONLINE|\s*\d{1,2}:|$)/i,
    );
    if (roomMatch) {
      room = roomMatch[1].replace(/[\s-]+$/, '').trim();
    }

    let lecturerName = 'Chưa rõ';
    const lecturerMatch = clusterText.match(
      /GV:\s*([A-Za-zÀ-ỹ\s]+?)(?=\s*\d{1,2}:|\s*Lab|\s*Phòng|\s*ONLINE|\s*$)/i,
    );
    if (lecturerMatch) {
      lecturerName = lecturerMatch[1].trim();
    }

    rows.push({
      day,
      date: dayDateByName[day] ?? null,
      startTime,
      endTime,
      subjectCode,
      subjectName,
      group,
      room,
      lecturerName,
    });
  }

  // 5. Thứ 2 -> Chủ Nhật, then by start time.
  rows.sort((a, b) => {
    const valA = DAY_NAME_TO_INDEX[a.day] ?? 99;
    const valB = DAY_NAME_TO_INDEX[b.day] ?? 99;
    if (valA !== valB) {
      return valA - valB;
    }
    return a.startTime.localeCompare(b.startTime);
  });

  return { metadata, rows, dayColumns: dayCols.length };
}
