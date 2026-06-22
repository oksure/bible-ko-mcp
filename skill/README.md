# bible-ko — Claude Skill

The same Korean Bible access as the [`bible-ko-mcp`](../README.md) server in this
repo, packaged as a **Claude Skill** (the lighter-weight, token-frugal
alternative). A skill loads into the agent's context only when invoked and shells
out to a small zero-dependency CLI, so it costs nothing while idle — handy in
coding agents (Claude Code, etc.) that already have shell access, where a
persistent MCP server is overkill.

## What's here

| Path | Purpose |
|------|---------|
| `SKILL.md` | the skill definition (frontmatter + usage patterns) |
| `bin/bible` | zero-dependency Python 3 CLI the skill drives |
| `references/books.md` | 66-book table (EN / 한글 / code / testament) + translation codes |

## Install

1. Put the CLI on your `PATH` and make it executable:
   ```bash
   chmod +x skill/bin/bible
   export PATH="$PWD/skill/bin:$PATH"     # or copy it to ~/.local/bin
   ```
2. Make the skill discoverable by your agent — e.g. for Claude Code:
   ```bash
   cp -r skill ~/.claude/skills/bible-ko
   ```

No API key or configuration needed — the data comes from the public
bskorea.or.kr site.

## Quick check

```bash
bible verses John 3 16
bible compare John 3 16
bible chapter 시편 1
```

## MCP vs. Skill — which to use?

- **MCP server** (`npx -y bible-ko-mcp`): structured tools inside MCP clients
  (Claude Desktop, TypingMind) — 6 typed tools with validation.
- **Skill** (this folder): a shell-driven CLI for coding agents — no running
  server, zero idle cost. The industry is steadily shifting routine API access
  from always-on MCP servers toward on-demand skills; this repo ships both so you
  can pick per context.

Both read the same source (대한성서공회, bskorea.or.kr) and share the same
known limitation: GAE (개역개정) parses reliably; GAE1/NIR/KOR sometimes return 0
verses because the source uses a different HTML structure for them.
