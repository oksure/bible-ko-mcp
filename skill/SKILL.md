---
name: bible-ko
description: "Read and search the Korean Bible (대한성서공회 bskorea.or.kr) — chapters, specific verses, translation comparison, keyword search across 66 books. No API key. 성경 읽기, 성경 구절, 성경 검색, 개역개정, 개역한글, 새번역, 공동번역, 성경 번역 비교, 성경 장절, 요한복음, 창세기, 시편"
version: "1.0"
allowed-tools: Bash(bible *), Bash(jq *)
---

## Status: active

# /bible-ko -- Korean Bible Reader & Search

Read, compare, and search the Korean Bible, sourced from 대한성서공회
(Korean Bible Society, bskorea.or.kr). 66 books, 5 translations, no API key.

> This skill is the lightweight, **token-frugal counterpart** to the
> [`bible-ko-mcp`](../README.md) MCP server in this repo: instead of a persistent
> server with 6 structured tools, it shells out to a small zero-dependency CLI on
> demand, so it costs nothing while idle. Use the MCP server inside MCP clients
> (Claude Desktop, TypingMind); use this skill inside coding agents with shell
> access.

## When NOT to use

- English-only study with cross-references / commentary -> use a dedicated Bible API
- Full-text search across the *entire* Bible -> this scans the first N chapters per book (the data source has no search endpoint; a full scan is ~1,189 HTTP requests)

## Setup

The skill drives the `bible` CLI bundled at `skill/bin/bible` (zero
dependencies, Python 3). Put it on your `PATH`:

```bash
chmod +x skill/bin/bible
export PATH="$PWD/skill/bin:$PATH"     # or copy it to ~/.local/bin
```

No API key or configuration needed.

## Core Patterns — `bible` CLI

`<book>` accepts an English name (`John`), a Korean name (`요한복음`), or a
3-letter code (`jhn`). Add `--json` for machine-readable output.

### Read a chapter
```bash
bible chapter John 3                    # 개역개정 (default)
bible chapter 요한복음 3
bible chapter Psalms 1 --version GAE1
```

### Specific verses (range or list)
```bash
bible verses John 3 16                  # a single verse
bible verses John 3 16-17               # a range
bible verses Genesis 1 1,3,5            # a list
```

### Compare translations side by side
```bash
bible compare John 3 16                 # GAE / GAE1 / NIR / KOR / CEV
```

### Search (first N chapters per book — see limitation)
```bash
bible search "사랑" --books "1 Corinthians" 
bible search "love" --version CEV --books "John,Mark" -n 5
bible search "은혜" --testament NT
```

### List books / translations
```bash
bible books                             # all 66
bible books --testament NT              # 27 NT books
bible versions
```

### File Index

| File | Purpose |
|------|---------|
| `bin/bible` | the zero-dependency CLI this skill drives |
| `references/books.md` | 66-book table (EN / 한글 / code / testament) + translation codes |

## Translations

| Code | Name | Notes |
|------|------|-------|
| `GAE`  | 개역개정 (Revised Korean) | **default — most reliable parsing** |
| `GAE1` | 개역한글 | may return 0 verses (different HTML on the source) |
| `NIR`  | 새번역 | may return 0 verses |
| `KOR`  | 공동번역 | may return 0 verses |
| `CEV`  | Contemporary English Version | English |

## Tips & Limitations

- **GAE is the reliable default.** GAE1/NIR/KOR sometimes return 0 verses because
  the source site uses a different HTML structure for them — a known data-source
  quirk inherited from the MCP server, not a CLI bug. Verify with GAE first.
- **Search is bounded**: it scans the first N chapters per book (default 10, `-n`
  to change), not the whole Bible. Narrow with `--books` or `--testament` for
  speed. Search matching is substring, case-insensitive.
- The CLI retries transient network failures up to 3 times with backoff.

## Output Contract

- **chapter / verses** — `{book, bookKorean, chapter, version, versionName, verses:[{number, text}]}`
- **compare** — `{book, korean, chapter, verse, translations:{GAE, GAE1, NIR, KOR, CEV}}`
- **search** — array of `{book, chapter, verse, text}`
- **books** — array of `{name, code, korean, testament}`

Present a chapter as `verse  text` lines; render `compare` and multi-verse
results as a markdown table when >=3 rows. Always cite book/chapter/verse.
