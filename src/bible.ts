import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { CONFIG } from "./config.js";

// Interfaces
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

// Bible book mappings
export const BIBLE_BOOKS: Record<string, { code: string; korean: string; testament: string }> = {
  // Old Testament
  "Genesis": { code: "gen", korean: "창세기", testament: "OT" },
  "Exodus": { code: "exo", korean: "출애굽기", testament: "OT" },
  "Leviticus": { code: "lev", korean: "레위기", testament: "OT" },
  "Numbers": { code: "num", korean: "민수기", testament: "OT" },
  "Deuteronomy": { code: "deu", korean: "신명기", testament: "OT" },
  "Joshua": { code: "jos", korean: "여호수아", testament: "OT" },
  "Judges": { code: "jdg", korean: "사사기", testament: "OT" },
  "Ruth": { code: "rut", korean: "룻기", testament: "OT" },
  "1 Samuel": { code: "1sa", korean: "사무엘상", testament: "OT" },
  "2 Samuel": { code: "2sa", korean: "사무엘하", testament: "OT" },
  "1 Kings": { code: "1ki", korean: "열왕기상", testament: "OT" },
  "2 Kings": { code: "2ki", korean: "열왕기하", testament: "OT" },
  "1 Chronicles": { code: "1ch", korean: "역대상", testament: "OT" },
  "2 Chronicles": { code: "2ch", korean: "역대하", testament: "OT" },
  "Ezra": { code: "ezr", korean: "에스라", testament: "OT" },
  "Nehemiah": { code: "neh", korean: "느헤미야", testament: "OT" },
  "Esther": { code: "est", korean: "에스더", testament: "OT" },
  "Job": { code: "job", korean: "욥기", testament: "OT" },
  "Psalms": { code: "psa", korean: "시편", testament: "OT" },
  "Proverbs": { code: "pro", korean: "잠언", testament: "OT" },
  "Ecclesiastes": { code: "ecc", korean: "전도서", testament: "OT" },
  "Song of Solomon": { code: "sng", korean: "아가", testament: "OT" },
  "Isaiah": { code: "isa", korean: "이사야", testament: "OT" },
  "Jeremiah": { code: "jer", korean: "예레미야", testament: "OT" },
  "Lamentations": { code: "lam", korean: "예레미야애가", testament: "OT" },
  "Ezekiel": { code: "ezk", korean: "에스겔", testament: "OT" },
  "Daniel": { code: "dan", korean: "다니엘", testament: "OT" },
  "Hosea": { code: "hos", korean: "호세아", testament: "OT" },
  "Joel": { code: "jol", korean: "요엘", testament: "OT" },
  "Amos": { code: "amo", korean: "아모스", testament: "OT" },
  "Obadiah": { code: "oba", korean: "오바댜", testament: "OT" },
  "Jonah": { code: "jon", korean: "요나", testament: "OT" },
  "Micah": { code: "mic", korean: "미가", testament: "OT" },
  "Nahum": { code: "nam", korean: "나훔", testament: "OT" },
  "Habakkuk": { code: "hab", korean: "하박국", testament: "OT" },
  "Zephaniah": { code: "zep", korean: "스바냐", testament: "OT" },
  "Haggai": { code: "hag", korean: "학개", testament: "OT" },
  "Zechariah": { code: "zec", korean: "스가랴", testament: "OT" },
  "Malachi": { code: "mal", korean: "말라기", testament: "OT" },
  // New Testament
  "Matthew": { code: "mat", korean: "마태복음", testament: "NT" },
  "Mark": { code: "mrk", korean: "마가복음", testament: "NT" },
  "Luke": { code: "luk", korean: "누가복음", testament: "NT" },
  "John": { code: "jhn", korean: "요한복음", testament: "NT" },
  "Acts": { code: "act", korean: "사도행전", testament: "NT" },
  "Romans": { code: "rom", korean: "로마서", testament: "NT" },
  "1 Corinthians": { code: "1co", korean: "고린도전서", testament: "NT" },
  "2 Corinthians": { code: "2co", korean: "고린도후서", testament: "NT" },
  "Galatians": { code: "gal", korean: "갈라디아서", testament: "NT" },
  "Ephesians": { code: "eph", korean: "에베소서", testament: "NT" },
  "Philippians": { code: "php", korean: "빌립보서", testament: "NT" },
  "Colossians": { code: "col", korean: "골로새서", testament: "NT" },
  "1 Thessalonians": { code: "1th", korean: "데살로니가전서", testament: "NT" },
  "2 Thessalonians": { code: "2th", korean: "데살로니가후서", testament: "NT" },
  "1 Timothy": { code: "1ti", korean: "디모데전서", testament: "NT" },
  "2 Timothy": { code: "2ti", korean: "디모데후서", testament: "NT" },
  "Titus": { code: "tit", korean: "디도서", testament: "NT" },
  "Philemon": { code: "phm", korean: "빌레몬서", testament: "NT" },
  "Hebrews": { code: "heb", korean: "히브리서", testament: "NT" },
  "James": { code: "jas", korean: "야고보서", testament: "NT" },
  "1 Peter": { code: "1pe", korean: "베드로전서", testament: "NT" },
  "2 Peter": { code: "2pe", korean: "베드로후서", testament: "NT" },
  "1 John": { code: "1jn", korean: "요한일서", testament: "NT" },
  "2 John": { code: "2jn", korean: "요한이서", testament: "NT" },
  "3 John": { code: "3jn", korean: "요한삼서", testament: "NT" },
  "Jude": { code: "jud", korean: "유다서", testament: "NT" },
  "Revelation": { code: "rev", korean: "요한계시록", testament: "NT" },
};

// Translation versions
export const TRANSLATIONS: Record<string, string> = {
  "GAE": "개역개정 (Revised Korean)",
  "GAE1": "개역한글 (Korean Revised Version)",
  "NIR": "새번역성경 (New Korean Revised Version)",
  "KOR": "공동번역 (Common Translation)",
  "CEV": "CEV (Contemporary English Version)",
};

// Simple cache implementation
export class SimpleCache<T> {
  private cache: Map<string, { data: T; timestamp: number }>;
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number, ttl: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, { data: value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Module-level singleton cache
export const verseCache = new SimpleCache<Chapter>(CONFIG.CACHE.MAX_SIZE, CONFIG.CACHE.TTL_MS);

// Helper function to find book code
export function findBookCode(bookName: string): string | null {
  const normalized = bookName.toLowerCase().trim();

  // Try direct match
  for (const [name, info] of Object.entries(BIBLE_BOOKS)) {
    if (name.toLowerCase() === normalized ||
        info.korean === bookName ||
        info.code === normalized) {
      return info.code;
    }
  }

  // Try partial match
  for (const [name, info] of Object.entries(BIBLE_BOOKS)) {
    if (name.toLowerCase().includes(normalized) ||
        info.korean.includes(bookName)) {
      return info.code;
    }
  }

  return null;
}

// Helper function to get book info by code
export function getBookInfo(code: string): { name: string; korean: string } | null {
  for (const [name, info] of Object.entries(BIBLE_BOOKS)) {
    if (info.code === code) {
      return { name, korean: info.korean };
    }
  }
  return null;
}

// Fetch and parse chapter with retry logic
export async function fetchChapter(
  bookCode: string,
  chapter: number,
  version: string = "GAE"
): Promise<Chapter> {
  const cacheKey = `${version}:${bookCode}:${chapter}`;
  const cached = verseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${CONFIG.API.BASE_URL}?version=${version}&book=${bookCode}&chap=${chapter}`;

  for (let attempt = 0; attempt <= CONFIG.API.RETRY.MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const verses: Verse[] = [];
      const seenVerses = new Set<number>();

      // Parse verses from span elements
      // The website uses span elements where verse text starts with verse number
      $("span").each((i, elem) => {
        const text = $(elem).text().trim();

        // Look for pattern: number followed by spaces and text
        const match = text.match(/^(\d+)\s+(.+)$/s);
        if (match) {
          const verseNum = parseInt(match[1]);
          let verseText = match[2];

          // Remove footnote markers (like 1), 2), etc.)
          verseText = verseText.replace(/\d+\)/g, "").trim();

          // Remove explanatory text that comes after line breaks (like "또는 ...")
          const lines = verseText.split("\n");
          verseText = lines[0].trim();

          // Avoid duplicate verses (website has multiple spans per verse)
          if (!seenVerses.has(verseNum)) {
            seenVerses.add(verseNum);
            verses.push({
              number: verseNum,
              text: verseText,
            });
          }
        }
      });

      // Empty-verse guard
      if (verses.length === 0) {
        console.error(`Warning: No verses parsed for ${bookCode} chapter ${chapter} (version: ${version})`);
      }

      const bookInfo = getBookInfo(bookCode);

      const chapterData: Chapter = {
        book: bookInfo?.name || bookCode,
        bookKorean: bookInfo?.korean || "",
        chapter,
        version,
        versionName: TRANSLATIONS[version] || version,
        verses,
      };

      verseCache.set(cacheKey, chapterData);
      return chapterData;
    } catch (error: unknown) {
      if (attempt === CONFIG.API.RETRY.MAX_RETRIES) {
        throw new Error(`Failed to fetch chapter ${bookCode} ${chapter}: ${error}`);
      }
      const delay = Math.min(
        CONFIG.API.RETRY.INITIAL_DELAY_MS * Math.pow(CONFIG.API.RETRY.BACKOFF_FACTOR, attempt),
        CONFIG.API.RETRY.MAX_DELAY_MS
      );
      await new Promise(r => setTimeout(r, delay));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Unreachable, but TypeScript needs it
  throw new Error(`Failed to fetch chapter ${bookCode} ${chapter} after retries`);
}

// Search verses
export async function searchVerses(
  query: string,
  version: string = "GAE",
  books?: string[]
): Promise<Array<{ book: string; chapter: number; verse: number; text: string }>> {
  const results: Array<{ book: string; chapter: number; verse: number; text: string }> = [];
  const searchLower = query.toLowerCase();

  // Determine which books to search
  const booksToSearch = books || Object.keys(BIBLE_BOOKS);

  for (const bookName of booksToSearch) {
    const bookInfo = BIBLE_BOOKS[bookName];
    if (!bookInfo) continue;

    // Search first few chapters (limit to avoid too many requests)
    for (let chapter = 1; chapter <= CONFIG.SEARCH.CHAPTERS_PER_BOOK; chapter++) {
      try {
        const chapterData = await fetchChapter(bookInfo.code, chapter, version);

        for (const verse of chapterData.verses) {
          if (verse.text.toLowerCase().includes(searchLower)) {
            results.push({
              book: chapterData.book,
              chapter: chapterData.chapter,
              verse: verse.number,
              text: verse.text,
            });
          }
        }
      } catch (error) {
        // Skip chapters that don't exist or fail to fetch
        break;
      }
    }
  }

  return results;
}
