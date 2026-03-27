#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { validateInput, getChapterSchema, getVersesSchema, searchBibleSchema, listBooksSchema, compareTranslationsSchema } from "./validation.js";
import { CONFIG } from "./config.js";
import { BIBLE_BOOKS, TRANSLATIONS, SimpleCache, findBookCode, getBookInfo, fetchChapter, searchVerses, verseCache, Verse, Chapter } from "./bible.js";

// Create MCP server
const server = new Server(
  {
    name: "bible-ko-mcp",
    version: "0.2.1",
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
          minimum: 1,
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
          description: "Book name (English or Korean) or code (e.g., 'Genesis', '창세기', 'gen')",
        },
        chapter: {
          type: "number",
          description: "Chapter number",
          minimum: 1,
        },
        verseStart: {
          type: "number",
          description: "Starting verse number",
          minimum: 1,
        },
        verseEnd: {
          type: "number",
          description: "Ending verse number (optional, defaults to verseStart)",
          minimum: 1,
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
    description: "Search for verses containing specific keywords. Searches the first 10 chapters of each book — not a full-Bible search.",
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
          description: "Book name (English or Korean) or code (e.g., 'Genesis', '창세기', 'gen')",
        },
        chapter: {
          type: "number",
          description: "Chapter number",
          minimum: 1,
        },
        verse: {
          type: "number",
          description: "Verse number",
          minimum: 1,
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
  {
    name: "health-check",
    description: "Check the health status of the Bible Korean MCP server and API connectivity",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {

    switch (name) {
      case "get-chapter": {
        const validated = validateInput(getChapterSchema, args, 'get-chapter');
        const bookCode = findBookCode(validated.book);
        if (!bookCode) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Book '${validated.book}' not found. Use list-books to see available books.`,
              },
            ],
          };
        }

        const chapterData = await fetchChapter(bookCode, validated.chapter, validated.version || "GAE");

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
        const validated = validateInput(getVersesSchema, args, 'get-verses');
        const { book, chapter, verseStart, verseEnd, version = "GAE" } = validated;

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
        const validated = validateInput(searchBibleSchema, args, 'search-bible');
        const { query, version = "GAE" } = validated;

        const results = await searchVerses(query, version);

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No results found for "${query}".`,
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
        const validated = validateInput(listBooksSchema, args, 'list-books');
        const { testament } = validated;

        let result = "# Bible Books\n\n";

        const books = Object.entries(BIBLE_BOOKS);

        if (!testament || testament === "OT") {
          result += "## Old Testament\n";
          books
            .filter(([, info]) => info.testament === "OT")
            .forEach(([name, info]) => {
              result += `- **${name}** (${info.korean}) - code: \`${info.code}\`\n`;
            });
        }

        if (!testament || testament === "NT") {
          result += "\n## New Testament\n";
          books
            .filter(([, info]) => info.testament === "NT")
            .forEach(([name, info]) => {
              result += `- **${name}** (${info.korean}) - code: \`${info.code}\`\n`;
            });
        }

        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "compare-translations": {
        const validated = validateInput(compareTranslationsSchema, args, 'compare-translations');
        const { book, chapter, verse, versions } = validated;

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

        // Fetch all versions concurrently
        const fetchResults = await Promise.all(
          versionsToCompare.map(async (versionCode) => {
            try {
              const chapterData = await fetchChapter(bookCode, chapter, versionCode);
              const verseData = chapterData.verses.find((v) => v.number === verse);
              return { versionCode, verseData, error: false };
            } catch (error) {
              return { versionCode, verseData: undefined, error: true };
            }
          })
        );

        let result = `# ${book} ${chapter}:${verse} - Translation Comparison\n\n`;

        for (const { versionCode, verseData, error } of fetchResults) {
          if (error) {
            result += `## ${TRANSLATIONS[versionCode] || versionCode}\n`;
            result += `(Error loading this version)\n\n`;
          } else if (verseData) {
            result += `## ${TRANSLATIONS[versionCode] || versionCode}\n`;
            result += `${verseData.text}\n\n`;
          }
        }

        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "health-check": {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "healthy",
                timestamp: new Date().toISOString(),
                api: {
                  baseUrl: CONFIG.API.BASE_URL,
                  timeout: CONFIG.API.TIMEOUT,
                },
                cache: {
                  enabled: true,
                  size: verseCache.size,
                  maxSize: CONFIG.CACHE.MAX_SIZE,
                  ttlMs: CONFIG.CACHE.TTL_MS,
                },
                config: {
                  maxBooksToSearch: CONFIG.SEARCH.MAX_BOOKS_TO_SEARCH,
                  chaptersPerBook: CONFIG.SEARCH.CHAPTERS_PER_BOOK,
                  availableBooks: Object.keys(BIBLE_BOOKS).length,
                  availableTranslations: Object.keys(TRANSLATIONS).length,
                },
              }, null, 2),
            },
          ],
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

    const errorDetails: Record<string, string> = {
      tool: name,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };

    if (error instanceof Error) {
      errorDetails.type = error.constructor.name;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: errorMessage,
            details: errorDetails,
          }, null, 2),
        },
      ],
      isError: true,
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
