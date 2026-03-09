/**
 * Shared helpers for Bible MCP test suite.
 * Core Bible fetching logic is duplicated here (self-contained) so tests
 * can run without importing index.ts, which starts the MCP server on load.
 */

import fetch from "node-fetch";
import * as cheerio from "cheerio";

export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  book: string;
  bookKorean: string;
  chapter: number;
  version: string;
  versionName: string;
  verses: Verse[];
}

const BIBLE_BOOKS: Record<string, { code: string; korean: string; testament: string }> = {
  "Genesis": { code: "gen", korean: "창세기", testament: "OT" },
  "Psalms": { code: "psa", korean: "시편", testament: "OT" },
  "Proverbs": { code: "pro", korean: "잠언", testament: "OT" },
  "Isaiah": { code: "isa", korean: "이사야", testament: "OT" },
  "Matthew": { code: "mat", korean: "마태복음", testament: "NT" },
  "Mark": { code: "mrk", korean: "마가복음", testament: "NT" },
  "Luke": { code: "luk", korean: "누가복음", testament: "NT" },
  "John": { code: "jhn", korean: "요한복음", testament: "NT" },
  "Romans": { code: "rom", korean: "로마서", testament: "NT" },
  "1 Corinthians": { code: "1co", korean: "고린도전서", testament: "NT" },
  "Galatians": { code: "gal", korean: "갈라디아서", testament: "NT" },
  "Ephesians": { code: "eph", korean: "에베소서", testament: "NT" },
  "Philippians": { code: "php", korean: "빌립보서", testament: "NT" },
  "Hebrews": { code: "heb", korean: "히브리서", testament: "NT" },
  "James": { code: "jas", korean: "야고보서", testament: "NT" },
  "Revelation": { code: "rev", korean: "요한계시록", testament: "NT" },
};

const TRANSLATIONS: Record<string, string> = {
  "GAE": "개역개정 (Revised Korean)",
  "GAE1": "개역한글 (Korean Revised Version)",
  "NIR": "새번역성경 (New Korean Revised Version)",
  "KOR": "공동번역 (Common Translation)",
  "CEV": "CEV (Contemporary English Version)",
};

export function findBookCode(bookName: string): string | null {
  const normalized = bookName.toLowerCase().trim();
  for (const [name, info] of Object.entries(BIBLE_BOOKS)) {
    if (
      name.toLowerCase() === normalized ||
      info.korean === bookName ||
      info.code === normalized
    ) {
      return info.code;
    }
  }
  for (const [name, info] of Object.entries(BIBLE_BOOKS)) {
    if (name.toLowerCase().includes(normalized) || info.korean.includes(bookName)) {
      return info.code;
    }
  }
  return null;
}

export async function fetchChapter(
  bookCode: string,
  chapter: number,
  version = "GAE"
): Promise<Chapter> {
  const url = `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=${version}&book=${bookCode}&chap=${chapter}`;
  const response = await fetch(url, { timeout: 30000 } as any);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const verses: Verse[] = [];

  $("span").each((_i, elem) => {
    const text = $(elem).text().trim();
    const match = text.match(/^(\d+)\s+(.+)$/s);
    if (match) {
      const verseNum = parseInt(match[1]);
      let verseText = match[2].replace(/\d+\)/g, "").trim();
      verseText = verseText.split("\n")[0].trim();
      if (!verses.find((v) => v.number === verseNum)) {
        verses.push({ number: verseNum, text: verseText });
      }
    }
  });

  const bookInfo = Object.entries(BIBLE_BOOKS).find(([, i]) => i.code === bookCode);
  return {
    book: bookInfo ? bookInfo[0] : bookCode,
    bookKorean: bookInfo ? bookInfo[1].korean : "",
    chapter,
    version,
    versionName: TRANSLATIONS[version] || version,
    verses,
  };
}

export function getVerses(chapter: Chapter, start: number, end?: number): Verse[] {
  const last = end ?? start;
  return chapter.verses.filter((v) => v.number >= start && v.number <= last);
}
