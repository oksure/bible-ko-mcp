# Bible Korean MCP - Usage Guide

## Quick Start

1. **Install dependencies and build:**
   ```bash
   npm install
   npm run build
   ```

2. **Configure Claude Desktop:**

   Edit your Claude Desktop config file:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

   Add this configuration:
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

3. **Restart Claude Desktop**

4. **Test it out!** Try asking Claude:
   - "Show me John 3:16 in Korean"
   - "Get Genesis chapter 1"
   - "Compare John 3:16 across different Korean translations"
   - "List all books in the New Testament"

## Example Queries

### Get a Complete Chapter
```
Can you get me the entire first chapter of Genesis in Korean?
```

This uses the `get-chapter` tool:
```json
{
  "book": "Genesis",
  "chapter": 1,
  "version": "GAE"
}
```

### Get Specific Verses
```
Show me John 3:16-17 in Korean
```

This uses the `get-verses` tool:
```json
{
  "book": "John",
  "chapter": 3,
  "verseStart": 16,
  "verseEnd": 17,
  "version": "GAE"
}
```

### Compare Translations
```
Compare Psalm 23:1 across different Korean Bible translations
```

This uses the `compare-translations` tool:
```json
{
  "book": "Psalms",
  "chapter": 23,
  "verse": 1,
  "versions": ["GAE", "NIR", "KOR"]
}
```

### List Books
```
What books are in the New Testament?
```

This uses the `list-books` tool:
```json
{
  "testament": "NT"
}
```

### Search (Limited)
```
Search for verses containing "사랑" (love) in Korean
```

This uses the `search-bible` tool:
```json
{
  "query": "사랑",
  "version": "GAE"
}
```

*Note: Search is limited to first few chapters of first few books for demo purposes*

## Available Bible Versions

| Code | Name | Description |
|------|------|-------------|
| GAE | 개역개정 | Revised Korean Standard Version (default) |
| GAE1 | 개역한글 | Korean Revised Version |
| NIR | 새번역성경 | New Korean Revised Version |
| KOR | 공동번역 | Common Translation |
| CEV | CEV | Contemporary English Version |

## Book Name Formats

You can refer to books in three ways:
1. **English name:** "Genesis", "Matthew", "Psalms"
2. **Korean name:** "창세기", "마태복음", "시편"
3. **Book code:** "gen", "mat", "psa"

## Testing

Run the included test to verify the parser works:
```bash
npx tsx src/test-final.ts
```

Expected output:
```
=== Test 1: John 3:16 ===
Fetched 36 verses from John 3

John 3:16 (요한복음 3:16):
하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니...
```

## Troubleshooting

### MCP server not showing in Claude
1. Check that the path in `claude_desktop_config.json` is absolute
2. Ensure the build directory exists: `ls build/index.js`
3. Restart Claude Desktop completely
4. Check Claude Desktop logs for errors

### Verses not parsing correctly
The website HTML structure may have changed. Run the test parser to debug:
```bash
npx tsx src/test-parser2.ts
```

### Search returns no results
Search is intentionally limited to avoid overloading the source website. For production use, you would need to:
- Implement caching
- Use the website's built-in search API (if available)
- Download and index the entire Bible locally

## Development

Watch mode for auto-rebuild:
```bash
npm run watch
```

In another terminal:
```bash
node build/index.js
```

## Notes

- The parser extracts verses from span elements on bskorea.or.kr
- Footnote markers (1), 2), etc.) are automatically removed
- Multiple spans per verse are deduplicated
- Some verses may have explanatory notes that are filtered out

## Sample Output

### John 3:16 (요한복음 3:16)
**Translation:** 개역개정 (Revised Korean)

**16.** 하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라

### Genesis 1:1 (창세기 1:1)
**Translation:** 개역개정 (Revised Korean)

**1.** 태초에 하나님이 천지를 창조하시니라
