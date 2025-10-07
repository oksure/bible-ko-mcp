# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides Korean Bible data from bskorea.or.kr to Claude Desktop. It implements 5 tools for Bible verse retrieval, search, and translation comparison.

**Key Technologies:**
- TypeScript
- MCP SDK (@modelcontextprotocol/sdk)
- cheerio (HTML parsing)
- node-fetch (HTTP requests)

**Data Source:** https://www.bskorea.or.kr/bible/korbibReadpage.php

## Development Commands

### Essential Commands
```bash
# Build the project (must do this before testing changes)
npm run build

# Run comprehensive test suite (25 tests, ~1 second)
npm test

# Run quick smoke tests (3 basic tests)
npm run test:quick

# Watch mode for development (auto-rebuild on changes)
npm run watch

# Start the MCP server (after building)
npm start
```

### Testing Individual Components
```bash
# Test HTML parser specifically
npx tsx src/test-parser2.ts

# Test comprehensive functionality
npx tsx src/test-comprehensive.ts

# Test specific translation or book
# Edit test files and run with: npx tsx src/test-*.ts
```

### Before Committing
```bash
npm test         # Must pass all 25 tests
npm run build    # Must compile without errors
```

## Architecture

### Core Components

**src/index.ts** - Main MCP server with three key sections:

1. **Data Mappings (lines 14-92)**
   - `BIBLE_BOOKS`: Maps 66 Bible books to codes (e.g., "Genesis" → "gen", "창세기" → "gen")
   - `TRANSLATIONS`: 5 Korean Bible versions (GAE, GAE1, NIR, KOR, CEV)
   - Book lookup supports: English names, Korean names (한글), and 3-letter codes

2. **Core Functions (lines 107-195)**
   - `findBookCode()`: Flexible book name resolver (case-insensitive, partial matching)
   - `fetchChapter()`: HTTP fetcher + HTML parser
   - `searchVerses()`: Limited search (only 2 books × 3 chapters to avoid overloading source)

3. **MCP Server Implementation (lines 240-520)**
   - 5 tools: `get-chapter`, `get-verses`, `search-bible`, `list-books`, `compare-translations`
   - Tool handlers in `CallToolRequestSchema` switch statement (lines 315-520)
   - Server runs on stdio transport for Claude Desktop integration

### HTML Parsing Strategy

**Critical Implementation Detail** (src/index.ts:156-182)

The website uses `<span>` elements with verse text starting with verse numbers:
```html
<span>1   태초에 하나님이 천지를 창조하시니라</span>
```

Parser logic:
1. Find all `<span>` elements
2. Match pattern: `^(\d+)\s+(.+)$` (number + spaces + text)
3. Remove footnote markers (e.g., "1)", "2)")
4. Remove explanatory text after newlines (e.g., "또는 ...")
5. Deduplicate verses (website has multiple spans per verse)

**If parsing breaks:** The website's HTML structure may have changed. Check:
- Run `npx tsx src/test-parser2.ts` to debug HTML structure
- Inspect `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=jhn&chap=3`
- Update parsing logic in `fetchChapter()` function

### Translation Support

**GAE (개역개정)** is the primary/default translation - most reliable parsing.

**Other translations (GAE1, NIR, KOR, CEV)** may use different HTML structures:
- Tests show NIR/GAE1 sometimes return 0 verses (different HTML format)
- KOR translation parsing is inconsistent
- Always test with GAE first when adding features

### Search Limitations

**Important:** Search is intentionally limited (src/index.ts:207-210)

```typescript
const limitedBooks = booksToSearch.slice(0, 2);  // Only 2 books
for (let chapter = 1; chapter <= 3; chapter++)   // Only 3 chapters
```

**Why:**
- Full Bible search = ~1,189 HTTP requests
- Would overload bskorea.or.kr servers
- No caching/rate limiting implemented

**For production search:** Would need local Bible database or caching layer.

## Test Suite Architecture

**src/test-comprehensive.ts** - 25 test cases covering:

1. **Basic functionality** (Tests 1-2): OT/NT chapter fetching
2. **Book name resolution** (Tests 3-6): English/Korean/code/case-insensitive
3. **Translation support** (Tests 7-9): GAE/NIR/KOR versions
4. **Verse operations** (Tests 10-11): Single verse, verse ranges
5. **Edge cases** (Tests 12-25): Long chapters, metadata, encoding, deduplication

**Test Philosophy:**
- Tests hit live website (no mocking) - validates real-world behavior
- Some tests allow graceful degradation (e.g., NIR returning 0 verses)
- 100% pass rate expected for GAE translation
- Run time: ~1 second total

## Publishing Workflow

**Setup Status:**
- ✅ NPM_TOKEN configured in GitHub repository secrets
- ✅ GitHub Actions workflows created (.github/workflows/publish.yml)
- ✅ CI workflow running on push (.github/workflows/ci.yml)
- 🔄 Ready to publish v0.1.0 to NPM

**To Publish a New Version:**

1. **Update version:**
   ```bash
   npm version patch  # 0.1.0 → 0.1.1 (bug fixes)
   npm version minor  # 0.1.0 → 0.2.0 (new features)
   npm version major  # 0.1.0 → 1.0.0 (breaking changes)
   ```

2. **Push changes and tags:**
   ```bash
   git push && git push --tags
   ```

3. **Create GitHub release:**
   - Go to https://github.com/oksure/bible-ko-mcp/releases
   - Click "Create a new release"
   - Choose the version tag (e.g., v0.1.0)
   - Write release notes
   - Click "Publish release"

4. **Automated workflow runs:**
   - Tests execute (all 25 must pass)
   - Build runs
   - Publishes to NPM with provenance
   - Package appears at npmjs.com/package/bible-ko-mcp

**Manual publish (alternative):** See PUBLISHING.md

**Important:**
- `prepublishOnly` script runs tests before publishing (safety net)
- Must pass all 25 tests before publish succeeds
- First publication must be done manually or via GitHub release

## Common Patterns

### Adding a New Bible Book
1. Add to `BIBLE_BOOKS` object (src/index.ts:14-83)
2. Include: English name, book code, Korean name, testament (OT/NT)
3. No other changes needed - `findBookCode()` handles lookups

### Adding a New Translation
1. Add to `TRANSLATIONS` object (src/index.ts:86-92)
2. Test parsing with new version code
3. May need parser adjustments if HTML structure differs

### Debugging Parse Failures
1. Run: `npx tsx src/test-parser2.ts`
2. Modify URL in test file to specific book/chapter/version
3. Inspect HTML structure in output
4. Adjust regex pattern in `fetchChapter()` if needed

## MCP Integration

**Claude Desktop Configuration (Local Development):**
```json
{
  "mcpServers": {
    "bible-ko": {
      "command": "node",
      "args": [
        "/Users/oksure/Documents/Dev/mcp/bible-ko-mcp/build/index.js"
      ]
    }
  }
}
```

**Once Published to NPM:**
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

**Config Location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**After making changes to the code:**
1. Run `npm run build` (must rebuild!)
2. Restart Claude Desktop completely (not just close window)
3. Verify server is running: ask Claude "What books are in the New Testament?"

**Troubleshooting:**
- Build file must exist: `ls build/index.js`
- Make executable: `chmod +x build/index.js`
- Test manually: `node build/index.js` (should print "Bible Korean MCP Server running on stdio")
- Check Claude Desktop logs if connection fails

## Code Organization

```
src/
├── index.ts               # Main MCP server (500+ lines)
├── test-comprehensive.ts  # 25 test cases (~500 lines)
├── test-final.ts         # Quick smoke tests (3 tests)
├── test-parser.ts        # HTML structure debugging
└── test-parser2.ts       # Focused parser testing

build/                    # TypeScript compilation output
├── index.js             # Compiled server (must exist for MCP)
└── index.d.ts           # Type definitions
```

**Note:** Test files are not published to NPM (excluded in package.json `files` field).

## Data Flow

1. **MCP Tool Call** → Claude Desktop sends request
2. **Tool Handler** → Switch statement routes to correct function
3. **Book Resolution** → `findBookCode()` normalizes book name
4. **HTTP Fetch** → GET request to bskorea.or.kr with query params
5. **HTML Parse** → cheerio + regex extract verses from spans
6. **Response Format** → Return markdown-formatted verses to Claude

**URL Pattern:**
```
https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=gen&chap=1
```

## Important Constraints

1. **No caching:** Every request hits the source website
2. **No rate limiting:** Be respectful of source server
3. **Search limited:** Only 2 books × 3 chapters (intentional)
4. **HTML dependency:** Parser breaks if website changes structure
5. **Translation support:** GAE most reliable; others may fail

## File Locations

- **Main server:** src/index.ts
- **All 66 book mappings:** src/index.ts lines 14-83
- **HTML parser logic:** src/index.ts lines 156-182
- **Tool definitions:** src/index.ts lines 247-313
- **Tool handlers:** src/index.ts lines 322-518
