# Bible Korean MCP Server

[![CI](https://github.com/oksure/bible-ko-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/oksure/bible-ko-mcp/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/bible-ko-mcp.svg)](https://www.npmjs.com/package/bible-ko-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for accessing the Korean Bible from bskorea.or.kr.

<a href="https://glama.ai/mcp/servers/@oksure/bible-ko-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@oksure/bible-ko-mcp/badge" alt="Bible Korean Server MCP server" />
</a>

**Features:**
- ⚡️ **In-memory caching** with 30-min TTL for fast repeated requests
- 🔄 **Automatic retry** with exponential backoff (3 retries, 1s→2s→4s) for transient failures
- 🛡️ **Robust error handling** with try/catch and graceful fallbacks
- ✅ **Input validation** with Zod schemas
- 🏥 **Health check** tool for monitoring
- 📚 **All 66 books** with 5 translations supported
- 🔍 **Full-text search** across entire Bible

## Node.js Version

Requires **Node.js 20+**

## Features

This MCP server provides tools to:
- Get complete chapters from the Korean Bible
- Retrieve specific verses or verse ranges
- Search for verses containing keywords
- List all available books
- Compare verses across different Korean translations

## Installation

Install globally via npm:

```bash
npm install -g bible-ko-mcp
```

Or use directly with npx (no installation required):

```bash
npx -y bible-ko-mcp
```

## Available Tools

### 1. `get-chapter`
Get all verses from a specific chapter.

**Parameters:**
- `book` (string, required): Book name in English, Korean, or book code
  - Examples: "Genesis", "창세기", "gen"
- `chapter` (number, required): Chapter number
- `version` (string, optional): Bible translation version (default: "GAE")
  - Options: "GAE", "GAE1", "NIR", "KOR", "CEV"

**Example:**
```json
{
  "book": "Genesis",
  "chapter": 1,
  "version": "GAE"
}
```

### 2. `get-verses`
Get specific verse(s) from a chapter.

**Parameters:**
- `book` (string, required): Book name or code
- `chapter` (number, required): Chapter number
- `verseStart` (number, required): Starting verse number
- `verseEnd` (number, optional): Ending verse number (defaults to verseStart)
- `version` (string, optional): Bible translation version (default: "GAE")

**Example:**
```json
{
  "book": "John",
  "chapter": 3,
  "verseStart": 16,
  "verseEnd": 17,
  "version": "GAE"
}
```

### 3. `search-bible`
Search for verses containing specific keywords.

**Parameters:**
- `query` (string, required): Search query in Korean or English
- `version` (string, optional): Bible translation version (default: "GAE")

**Note:** Search covers all 66 books of the Bible with fallback results.

**Example:**
```json
{
  "query": "사랑",
  "version": "GAE"
}
```

### 4. `list-books`
List all available books in the Bible.

**Parameters:**
- `testament` (string, optional): Filter by testament ("OT" or "NT")

**Example:**
```json
{
  "testament": "NT"
}
```

### 5. `compare-translations`
Compare a verse across different Korean translations.

**Parameters:**
- `book` (string, required): Book name or code
- `chapter` (number, required): Chapter number
- `verse` (number, required): Verse number
- `versions` (array, optional): Array of version codes to compare (default: all versions)

**Example:**
```json
{
  "book": "John",
  "chapter": 3,
  "verse": 16,
  "versions": ["GAE", "NIR", "KOR"]
}
```

## Bible Translations

- **GAE**: 개역개정 (Revised Korean Standard Version)
- **GAE1**: 개역한글 (Korean Revised Version)
- **NIR**: 새번역성경 (New Korean Revised Version)
- **KOR**: 공동번역 (Common Translation)
- **CEV**: CEV (Contemporary English Version)

## Book Codes

### Old Testament
- Genesis (창세기): `gen`
- Exodus (출애굽기): `exo`
- Leviticus (레위기): `lev`
- Numbers (민수기): `num`
- Deuteronomy (신명기): `deu`
- ... (see full list in source code)

### New Testament
- Matthew (마태복음): `mat`
- Mark (마가복음): `mrk`
- Luke (누가복음): `luk`
- John (요한복음): `jhn`
- Acts (사도행전): `act`
- ... (see full list in source code)

## Usage with Claude Desktop

Add to your Claude Desktop configuration:

### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bible-ko": {
      "command": "npx",
      "args": [
        "-y",
        "bible-ko-mcp"
      ]
    }
  }
}
```

### Windows
Edit `%APPDATA%\Claude\claude_desktop_config.json` with the same configuration above.

After adding the configuration, restart Claude Desktop completely.

## Development

For local development:

```bash
# Clone the repository
git clone https://github.com/oksure/bible-ko-mcp.git
cd bible-ko-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch mode (auto-rebuild on changes)
npm run watch

# Run locally
npm start
```

### Local Development with Claude Desktop

For testing local changes, use this configuration:

```json
{
  "mcpServers": {
    "bible-ko": {
      "command": "node",
      "args": [
        "/absolute/path/to/bible-ko-mcp/build/index.js"
      ]
    }
  }
}
```

Remember to run `npm run build` after making changes.

## Technical Details

- Built with TypeScript and the MCP SDK
- Uses cheerio for HTML parsing
- Fetches data from bskorea.or.kr with automatic retry (exponential backoff) on transient failures
- In-memory cache (30-min TTL, 2000 entries) avoids redundant requests
- Supports all 66 books of the Bible
- Handles Korean and English book names

## Use Cases

### Sermon Preparation

**Weekly Sunday sermon with the Beatitudes**

Ask Claude: *"Give me Matthew 5:3-12 in Korean (GAE) with each beatitude on a separate line for my sermon outline."*

```
Tool: get-verses
Book: Matthew, Chapter: 5, Start: 3, End: 12
```

**Good Friday — Messianic prophecy from Isaiah**

```
Tool: get-chapter
Book: Isaiah, Chapter: 53, Version: GAE
```

**Christmas Eve sermon — The nativity narrative**

```
Tool: get-verses
Book: Luke, Chapter: 2, Start: 1, End: 20
```

**Easter Sunday — The resurrection account**

```
Tool: get-chapter
Book: John, Chapter: 20, Version: GAE
```

**Wedding homily — The Love Chapter**

```
Tool: get-chapter
Book: 1 Corinthians, Chapter: 13, Version: GAE
```

**Missions Sunday — The Great Commission**

```
Tool: get-verses
Book: Matthew, Chapter: 28, Start: 18, End: 20
```

---

### Bible Study Groups

**Comparing John 3:16 across translations for group discussion**

```
Tool: compare-translations
Book: John, Chapter: 3, Verse: 16
Versions: ["GAE", "GAE1", "NIR", "KOR"]
```

**Topical study: Living Faith (야고보서의 믿음)**

```
Tool: get-verses
Book: James, Chapter: 2, Start: 14, End: 26
```

**Fruit of the Spirit study**

```
Tool: get-verses
Book: Galatians, Chapter: 5, Start: 22, End: 23
```

**Hebrews 11 "Faith Hall of Fame" — full chapter**

```
Tool: get-chapter
Book: Hebrews, Chapter: 11, Version: GAE
```

**Spiritual warfare — full armor of God passage**

```
Tool: get-verses
Book: Ephesians, Chapter: 6, Start: 10, End: 18
```

---

### Personal Devotional

**Psalm 23 for comfort (funeral message, hospital visits)**

```
Tool: get-chapter
Book: Psalms, Chapter: 23, Version: GAE
```

**Romans 8:28-39 — Assurance of God's love**

```
Tool: get-verses
Book: Romans, Chapter: 8, Start: 28, End: 39
```

**Daily scripture memory verse**

```
Tool: get-verses
Book: Philippians, Chapter: 4, Start: 13, End: 13
```

**Advent devotional — The Word became flesh**

```
Tool: get-verses
Book: John, Chapter: 1, Start: 1, End: 14
```

---

### Korean Language Look-up

All tools accept Korean book names, making it natural to reference Scripture in Korean:

```
Tool: get-chapter
Book: 시편 (Psalms), Chapter: 23
```

```
Tool: get-verses
Book: 잠언 (Proverbs), Chapter: 3, Start: 5, End: 6
```

```
Tool: search-bible
Query: 하나님의 사랑 (God's love)
```



## Notes

- The HTML parsing may need adjustment based on website updates
- Search functionality is limited for demo purposes to avoid excessive requests
- Some translations may not be available for all books

## Publishing

This package is automatically published to NPM when a new GitHub release is created. See [PUBLISHING.md](PUBLISHING.md) for detailed instructions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
