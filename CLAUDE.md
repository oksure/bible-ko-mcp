# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP (Model Context Protocol) server that provides Korean Bible data from bskorea.or.kr to Claude Desktop. Implements 6 tools for Bible verse retrieval, search, and translation comparison.

**Key Technologies:** TypeScript, MCP SDK, cheerio (HTML parsing), node-fetch, Zod (validation)

**Data Source:** https://www.bskorea.or.kr/bible/korbibReadpage.php

## Development Commands

```bash
npm run build     # Build (must do before testing changes)
npm test          # Run vitest suite (42 tests)
npm run watch     # Watch mode (auto-rebuild)
npm start         # Start MCP server (after building)
```

### Before Committing
```bash
npm test          # Must pass all 42 tests
npm run build     # Must compile without errors
```

## Architecture

### Module Structure

```
src/
├── bible.ts       # Domain logic: data, cache, fetch, parse, search
├── index.ts       # MCP server: tool definitions + handlers
├── config.ts      # Configuration constants
├── validation.ts  # Zod schemas for tool inputs
└── tests/
    ├── bible-study.test.ts  # Vitest suite (42 tests)
    └── helpers.ts           # Re-exports from bible.ts + getVerses()
```

- **src/bible.ts** — All Bible domain logic (BIBLE_BOOKS, TRANSLATIONS, SimpleCache, findBookCode, getBookInfo, fetchChapter, searchVerses). Importable without starting the MCP server.
- **src/index.ts** — MCP server setup, 6 tool definitions, tool handler switch statement. Imports everything from bible.ts.
- **src/config.ts** — API URL, timeout, retry settings (3 retries, exponential backoff), cache settings (30-min TTL, 2000 max entries), search limits.
- **src/validation.ts** — Zod schemas for all tool inputs.

### HTML Parsing Strategy

The website uses `<span>` elements with verse text starting with verse numbers:
```html
<span>1   태초에 하나님이 천지를 창조하시니라</span>
```

Parser logic (in `fetchChapter()` in bible.ts):
1. Find all `<span>` elements
2. Match pattern: `^(\d+)\s+(.+)$` (number + spaces + text)
3. Remove footnote markers (e.g., "1)", "2)")
4. Remove explanatory text after newlines
5. Deduplicate verses (website has multiple spans per verse)

**If parsing breaks:** Website HTML may have changed. Inspect the URL directly and update regex in `fetchChapter()`.

### Translation Support

**GAE (개역개정)** is the primary/default — most reliable parsing.

Other translations (GAE1, NIR, KOR, CEV) may use different HTML structures and sometimes return 0 verses. Always test with GAE first.

### Search Limitations

Search scans first 10 chapters per book (configurable via CONFIG.SEARCH.CHAPTERS_PER_BOOK). Not a full-Bible search — would require ~1,189+ HTTP requests.

### Retry & Caching

- **Retry**: fetchChapter retries up to 3 times with exponential backoff (1s, 2s, 4s) on transient failures.
- **Cache**: In-memory SimpleCache with 30-min TTL, keyed on `version:bookCode:chapter`. FIFO eviction at 2000 entries.
- **compare-translations**: Fetches all versions concurrently via Promise.all().

## MCP Tools

6 tools: `get-chapter`, `get-verses`, `search-bible`, `list-books`, `compare-translations`, `health-check`

## Common Patterns

### Adding a New Bible Book
1. Add to `BIBLE_BOOKS` in src/bible.ts
2. Include: English name, book code, Korean name, testament (OT/NT)

### Adding a New Translation
1. Add to `TRANSLATIONS` in src/bible.ts
2. Test parsing with the new version code

## Publishing

Published to NPM as `bible-ko-mcp`. CI runs on push; publish triggers on GitHub release.

```bash
npm version patch && git push && git push --tags
# Then create GitHub release → auto-publishes to NPM with provenance
```

## MCP Integration

```json
{
  "mcpServers": {
    "bible-ko": {
      "command": "npx",
      "args": ["-y", "bible-ko-mcp"]
    }
  }
}
```

Config location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
