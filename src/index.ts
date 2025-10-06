#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Bible book mappings
const BIBLE_BOOKS: Record<string, { code: string; korean: string; testament: string }> = {
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
const TRANSLATIONS: Record<string, string> = {
  "GAE": "개역개정 (Revised Korean)",
  "GAE1": "개역한글 (Korean Revised Version)",
  "NIR": "새번역성경 (New Korean Revised Version)",
  "KOR": "공동번역 (Common Translation)",
  "CEV": "CEV (Contemporary English Version)",
};

interface Verse {
  number: number;
  text: string;
}

interface Chapter {
  book: string;
  bookKorean: string;
  chapter: number;
  version: string;
  versionName: string;
  verses: Verse[];
}

// Helper function to find book code
function findBookCode(bookName: string): string | null {
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
function getBookInfo(code: string): { name: string; korean: string } | null {
  for (const [name, info] of Object.entries(BIBLE_BOOKS)) {
    if (info.code === code) {
      return { name, korean: info.korean };
    }
  }
  return null;
}

// Fetch and parse chapter
async function fetchChapter(
  bookCode: string,
  chapter: number,
  version: string = "GAE"
): Promise<Chapter> {
  const url = `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=${version}&book=${bookCode}&chap=${chapter}`;

  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const verses: Verse[] = [];

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
      if (!verses.find((v) => v.number === verseNum)) {
        verses.push({
          number: verseNum,
          text: verseText,
        });
      }
    }
  });

  const bookInfo = getBookInfo(bookCode);

  return {
    book: bookInfo?.name || bookCode,
    bookKorean: bookInfo?.korean || "",
    chapter,
    version,
    versionName: TRANSLATIONS[version] || version,
    verses,
  };
}

// Search verses
async function searchVerses(
  query: string,
  version: string = "GAE",
  books?: string[]
): Promise<Array<{ book: string; chapter: number; verse: number; text: string }>> {
  const results: Array<{ book: string; chapter: number; verse: number; text: string }> = [];
  const searchLower = query.toLowerCase();

  // Determine which books to search
  const booksToSearch = books || Object.keys(BIBLE_BOOKS);

  // For demo purposes, we'll search Genesis and Matthew only
  // In production, you'd want to implement proper search or use the website's search feature
  const limitedBooks = booksToSearch.slice(0, 2);

  for (const bookName of limitedBooks) {
    const bookInfo = BIBLE_BOOKS[bookName];
    if (!bookInfo) continue;

    // Search first few chapters (limit to avoid too many requests)
    for (let chapter = 1; chapter <= 3; chapter++) {
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
        // Skip chapters that don't exist
        break;
      }
    }
  }

  return results;
}

// Create MCP server
const server = new Server(
  {
    name: "bible-ko-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
const tools: Tool[] = [
  {
    name: "get-chapter",
    description: "Get all verses from a specific chapter of the Korean Bible",
    inputSchema: {
      type: "object",
      properties: {
        book: {
          type: "string",
          description: "Book name (English or Korean) or code (e.g., 'Genesis', '창세기', 'gen')",
        },
        chapter: {
          type: "number",
          description: "Chapter number",
        },
        version: {
          type: "string",
          description: "Bible translation version (default: GAE)",
          enum: ["GAE", "GAE1", "NIR", "KOR", "CEV"],
          default: "GAE",
        },
      },
      required: ["book", "chapter"],
    },
  },
  {
    name: "get-verses",
    description: "Get specific verse(s) from a chapter",
    inputSchema: {
      type: "object",
      properties: {
        book: {
          type: "string",
          description: "Book name (English or Korean) or code",
        },
        chapter: {
          type: "number",
          description: "Chapter number",
        },
        verseStart: {
          type: "number",
          description: "Starting verse number",
        },
        verseEnd: {
          type: "number",
          description: "Ending verse number (optional, defaults to verseStart)",
        },
        version: {
          type: "string",
          description: "Bible translation version (default: GAE)",
          enum: ["GAE", "GAE1", "NIR", "KOR", "CEV"],
          default: "GAE",
        },
      },
      required: ["book", "chapter", "verseStart"],
    },
  },
  {
    name: "search-bible",
    description: "Search for verses containing specific keywords (searches limited books for demo)",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (Korean or English)",
        },
        version: {
          type: "string",
          description: "Bible translation version (default: GAE)",
          enum: ["GAE", "GAE1", "NIR", "KOR", "CEV"],
          default: "GAE",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list-books",
    description: "List all available books in the Bible",
    inputSchema: {
      type: "object",
      properties: {
        testament: {
          type: "string",
          description: "Filter by testament (OT/NT, optional)",
          enum: ["OT", "NT"],
        },
      },
    },
  },
  {
    name: "compare-translations",
    description: "Compare a verse across different Korean translations",
    inputSchema: {
      type: "object",
      properties: {
        book: {
          type: "string",
          description: "Book name (English or Korean) or code",
        },
        chapter: {
          type: "number",
          description: "Chapter number",
        },
        verse: {
          type: "number",
          description: "Verse number",
        },
        versions: {
          type: "array",
          items: { type: "string" },
          description: "Array of version codes to compare (default: all versions)",
        },
      },
      required: ["book", "chapter", "verse"],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "get-chapter": {
        const { book, chapter, version = "GAE" } = args as {
          book: string;
          chapter: number;
          version?: string;
        };

        const bookCode = findBookCode(book);
        if (!bookCode) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Book '${book}' not found. Use list-books to see available books.`,
              },
            ],
          };
        }

        const chapterData = await fetchChapter(bookCode, chapter, version);

        let result = `# ${chapterData.book} (${chapterData.bookKorean}) ${chapterData.chapter}\n`;
        result += `**Translation:** ${chapterData.versionName}\n\n`;

        for (const verse of chapterData.verses) {
          result += `**${verse.number}.** ${verse.text}\n\n`;
        }

        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get-verses": {
        const { book, chapter, verseStart, verseEnd, version = "GAE" } = args as {
          book: string;
          chapter: number;
          verseStart: number;
          verseEnd?: number;
          version?: string;
        };

        const bookCode = findBookCode(book);
        if (!bookCode) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Book '${book}' not found.`,
              },
            ],
          };
        }

        const chapterData = await fetchChapter(bookCode, chapter, version);
        const endVerse = verseEnd || verseStart;

        const selectedVerses = chapterData.verses.filter(
          (v) => v.number >= verseStart && v.number <= endVerse
        );

        let result = `# ${chapterData.book} ${chapterData.chapter}:${verseStart}`;
        if (endVerse !== verseStart) result += `-${endVerse}`;
        result += `\n**Translation:** ${chapterData.versionName}\n\n`;

        for (const verse of selectedVerses) {
          result += `**${verse.number}.** ${verse.text}\n\n`;
        }

        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "search-bible": {
        const { query, version = "GAE" } = args as {
          query: string;
          version?: string;
        };

        const results = await searchVerses(query, version);

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No results found for "${query}" (searched limited books for demo)`,
              },
            ],
          };
        }

        let result = `# Search Results for "${query}"\n`;
        result += `Found ${results.length} verses:\n\n`;

        for (const verse of results) {
          result += `**${verse.book} ${verse.chapter}:${verse.verse}**\n`;
          result += `${verse.text}\n\n`;
        }

        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "list-books": {
        const { testament } = args as { testament?: string };

        let result = "# Bible Books\n\n";

        const filtered = Object.entries(BIBLE_BOOKS).filter(
          ([, info]) => !testament || info.testament === testament
        );

        result += "## Old Testament\n";
        filtered
          .filter(([, info]) => info.testament === "OT")
          .forEach(([name, info]) => {
            result += `- **${name}** (${info.korean}) - code: \`${info.code}\`\n`;
          });

        result += "\n## New Testament\n";
        filtered
          .filter(([, info]) => info.testament === "NT")
          .forEach(([name, info]) => {
            result += `- **${name}** (${info.korean}) - code: \`${info.code}\`\n`;
          });

        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "compare-translations": {
        const { book, chapter, verse, versions } = args as {
          book: string;
          chapter: number;
          verse: number;
          versions?: string[];
        };

        const bookCode = findBookCode(book);
        if (!bookCode) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Book '${book}' not found.`,
              },
            ],
          };
        }

        const versionsToCompare = versions || Object.keys(TRANSLATIONS);

        let result = `# ${book} ${chapter}:${verse} - Translation Comparison\n\n`;

        for (const versionCode of versionsToCompare) {
          try {
            const chapterData = await fetchChapter(bookCode, chapter, versionCode);
            const verseData = chapterData.verses.find((v) => v.number === verse);

            if (verseData) {
              result += `## ${TRANSLATIONS[versionCode] || versionCode}\n`;
              result += `${verseData.text}\n\n`;
            }
          } catch (error) {
            result += `## ${TRANSLATIONS[versionCode] || versionCode}\n`;
            result += `(Error loading this version)\n\n`;
          }
        }

        return {
          content: [{ type: "text", text: result }],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bible Korean MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
