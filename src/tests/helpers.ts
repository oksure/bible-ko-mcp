/**
 * Shared helpers for Bible MCP test suite.
 * Imports from bible.ts (domain logic separated from MCP server bootstrap).
 */

export { findBookCode, fetchChapter, type Verse, type Chapter } from "../bible.js";
import type { Chapter } from "../bible.js";

export function getVerses(chapter: Chapter, start: number, end?: number) {
  const last = end ?? start;
  return chapter.verses.filter((v) => v.number >= start && v.number <= last);
}
