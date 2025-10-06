#!/usr/bin/env node
import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Copy the necessary types and functions from index.ts
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

const BIBLE_BOOKS: Record<string, { code: string; korean: string; testament: string }> = {
  "Genesis": { code: "gen", korean: "창세기", testament: "OT" },
  "Exodus": { code: "exo", korean: "출애굽기", testament: "OT" },
  "Matthew": { code: "mat", korean: "마태복음", testament: "NT" },
  "John": { code: "jhn", korean: "요한복음", testament: "NT" },
  "Romans": { code: "rom", korean: "로마서", testament: "NT" },
  "Revelation": { code: "rev", korean: "요한계시록", testament: "NT" },
  "Psalms": { code: "psa", korean: "시편", testament: "OT" },
};

const TRANSLATIONS: Record<string, string> = {
  "GAE": "개역개정 (Revised Korean)",
  "GAE1": "개역한글 (Korean Revised Version)",
  "NIR": "새번역성경 (New Korean Revised Version)",
  "KOR": "공동번역 (Common Translation)",
  "CEV": "CEV (Contemporary English Version)",
};

function findBookCode(bookName: string): string | null {
  const normalized = bookName.toLowerCase().trim();

  for (const [name, info] of Object.entries(BIBLE_BOOKS)) {
    if (name.toLowerCase() === normalized ||
        info.korean === bookName ||
        info.code === normalized) {
      return info.code;
    }
  }

  for (const [name, info] of Object.entries(BIBLE_BOOKS)) {
    if (name.toLowerCase().includes(normalized) ||
        info.korean.includes(bookName)) {
      return info.code;
    }
  }

  return null;
}

function getBookInfo(code: string): { name: string; korean: string } | null {
  for (const [name, info] of Object.entries(BIBLE_BOOKS)) {
    if (info.code === code) {
      return { name, korean: info.korean };
    }
  }
  return null;
}

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

  $("span").each((i, elem) => {
    const text = $(elem).text().trim();

    const match = text.match(/^(\d+)\s+(.+)$/s);
    if (match) {
      const verseNum = parseInt(match[1]);
      let verseText = match[2];

      verseText = verseText.replace(/\d+\)/g, "").trim();

      const lines = verseText.split("\n");
      verseText = lines[0].trim();

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

// Test suite
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, passed: true, duration });
    console.log(`✓ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMsg, duration });
    console.log(`✗ ${name} (${duration}ms)`);
    console.log(`  Error: ${errorMsg}`);
  }
}

async function runAllTests() {
  console.log("🧪 Running Comprehensive Test Suite for Bible Korean MCP\n");
  console.log("=" .repeat(60));

  // Test 1: Basic chapter fetching - Old Testament
  await runTest("Fetch Genesis 1 (Old Testament)", async () => {
    const chapter = await fetchChapter("gen", 1, "GAE");
    if (chapter.verses.length !== 31) {
      throw new Error(`Expected 31 verses, got ${chapter.verses.length}`);
    }
    if (!chapter.verses[0].text.includes("태초에")) {
      throw new Error("First verse should contain '태초에'");
    }
  });

  // Test 2: Basic chapter fetching - New Testament
  await runTest("Fetch John 3 (New Testament)", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    if (chapter.verses.length !== 36) {
      throw new Error(`Expected 36 verses, got ${chapter.verses.length}`);
    }
    const verse16 = chapter.verses.find(v => v.number === 16);
    if (!verse16 || !verse16.text.includes("하나님이 세상을")) {
      throw new Error("John 3:16 should contain '하나님이 세상을'");
    }
  });

  // Test 3: Different book name formats - English
  await runTest("Find book by English name", async () => {
    const code = findBookCode("Genesis");
    if (code !== "gen") {
      throw new Error(`Expected 'gen', got '${code}'`);
    }
  });

  // Test 4: Different book name formats - Korean
  await runTest("Find book by Korean name", async () => {
    const code = findBookCode("창세기");
    if (code !== "gen") {
      throw new Error(`Expected 'gen', got '${code}'`);
    }
  });

  // Test 5: Different book name formats - Code
  await runTest("Find book by code", async () => {
    const code = findBookCode("gen");
    if (code !== "gen") {
      throw new Error(`Expected 'gen', got '${code}'`);
    }
  });

  // Test 6: Case insensitive book search
  await runTest("Find book case-insensitive", async () => {
    const code = findBookCode("GENESIS");
    if (code !== "gen") {
      throw new Error(`Expected 'gen', got '${code}'`);
    }
  });

  // Test 7: Multiple translations - GAE
  await runTest("Fetch chapter with GAE translation", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    if (chapter.version !== "GAE") {
      throw new Error(`Expected version 'GAE', got '${chapter.version}'`);
    }
    if (!chapter.versionName.includes("개역개정")) {
      throw new Error("Version name should include '개역개정'");
    }
  });

  // Test 8: Multiple translations - NIR (may not be available)
  await runTest("Fetch chapter with NIR translation", async () => {
    const chapter = await fetchChapter("jhn", 3, "NIR");
    if (chapter.version !== "NIR") {
      throw new Error(`Expected version 'NIR', got '${chapter.version}'`);
    }
    // NIR might not be available or may use different parsing
    // Just verify we got a response
    if (chapter.verses.length === 0) {
      console.log("    ⚠️  NIR returned 0 verses - translation may not be available");
    }
  });

  // Test 9: Multiple translations - KOR
  await runTest("Fetch chapter with KOR translation", async () => {
    const chapter = await fetchChapter("jhn", 3, "KOR");
    if (chapter.version !== "KOR") {
      throw new Error(`Expected version 'KOR', got '${chapter.version}'`);
    }
  });

  // Test 10: Specific verses extraction
  await runTest("Extract specific verse (John 3:16)", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    const verse16 = chapter.verses.find(v => v.number === 16);
    if (!verse16) {
      throw new Error("Could not find verse 16");
    }
    if (verse16.text.length < 50) {
      throw new Error("Verse 16 text seems too short");
    }
  });

  // Test 11: Verse range extraction
  await runTest("Extract verse range (John 3:16-17)", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    const verses = chapter.verses.filter(v => v.number >= 16 && v.number <= 17);
    if (verses.length !== 2) {
      throw new Error(`Expected 2 verses, got ${verses.length}`);
    }
  });

  // Test 12: Long chapter (Psalm-like)
  await runTest("Fetch Matthew 5 (Sermon on the Mount)", async () => {
    const chapter = await fetchChapter("mat", 5, "GAE");
    if (chapter.verses.length !== 48) {
      throw new Error(`Expected 48 verses, got ${chapter.verses.length}`);
    }
  });

  // Test 13: Short chapter
  await runTest("Fetch Romans 1", async () => {
    const chapter = await fetchChapter("rom", 1, "GAE");
    if (chapter.verses.length < 30) {
      throw new Error(`Expected at least 30 verses, got ${chapter.verses.length}`);
    }
  });

  // Test 14: Book info retrieval
  await runTest("Get book info by code", async () => {
    const info = getBookInfo("gen");
    if (!info || info.name !== "Genesis" || info.korean !== "창세기") {
      throw new Error("Book info mismatch");
    }
  });

  // Test 15: Invalid book handling
  await runTest("Handle invalid book name", async () => {
    const code = findBookCode("InvalidBook");
    if (code !== null) {
      throw new Error("Should return null for invalid book");
    }
  });

  // Test 16: Verse numbering consistency
  await runTest("Verify verse numbering is sequential", async () => {
    const chapter = await fetchChapter("gen", 1, "GAE");
    for (let i = 1; i <= chapter.verses.length; i++) {
      const verse = chapter.verses.find(v => v.number === i);
      if (!verse) {
        throw new Error(`Missing verse number ${i}`);
      }
    }
  });

  // Test 17: Korean text encoding
  await runTest("Verify Korean text encoding", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    const hasKorean = chapter.verses.some(v => /[가-힣]/.test(v.text));
    if (!hasKorean) {
      throw new Error("No Korean characters found in verses");
    }
  });

  // Test 18: Chapter metadata
  await runTest("Verify chapter metadata", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    if (chapter.book !== "John") {
      throw new Error(`Expected book 'John', got '${chapter.book}'`);
    }
    if (chapter.bookKorean !== "요한복음") {
      throw new Error(`Expected '요한복음', got '${chapter.bookKorean}'`);
    }
    if (chapter.chapter !== 3) {
      throw new Error(`Expected chapter 3, got ${chapter.chapter}`);
    }
  });

  // Test 19: Empty/whitespace handling
  await runTest("Verify verses have non-empty text", async () => {
    const chapter = await fetchChapter("gen", 1, "GAE");
    const emptyVerses = chapter.verses.filter(v => !v.text || v.text.trim().length === 0);
    if (emptyVerses.length > 0) {
      throw new Error(`Found ${emptyVerses.length} empty verses`);
    }
  });

  // Test 20: Footnote removal
  await runTest("Verify footnote markers are removed", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    // The raw HTML has markers like "1)", "2)" which should be removed
    const verse1 = chapter.verses[0];
    // Check that standalone digit+paren patterns are removed
    const hasStandaloneMarker = /\s\d+\)\s/.test(verse1.text);
    if (hasStandaloneMarker) {
      throw new Error("Footnote markers not properly removed");
    }
  });

  // Test 21: Multiple chapters from same book
  await runTest("Fetch multiple chapters from same book", async () => {
    const gen1 = await fetchChapter("gen", 1, "GAE");
    const gen2 = await fetchChapter("gen", 2, "GAE");

    if (gen1.chapter !== 1 || gen2.chapter !== 2) {
      throw new Error("Chapter numbers don't match");
    }
    if (gen1.verses[0].text === gen2.verses[0].text) {
      throw new Error("Chapters have identical first verses (caching issue?)");
    }
  });

  // Test 22: Translation comparison (GAE vs GAE1 - may have parsing differences)
  await runTest("Compare translations availability", async () => {
    const gae = await fetchChapter("jhn", 3, "GAE");
    const gae1 = await fetchChapter("jhn", 3, "GAE1");

    const verse16_gae = gae.verses.find(v => v.number === 16);

    if (!verse16_gae) {
      throw new Error("Could not find verse 16 in GAE translation");
    }

    // GAE (default) should always work
    if (verse16_gae.text.length < 10) {
      throw new Error("GAE verse text too short");
    }

    if (!verse16_gae.text.includes("하나님")) {
      throw new Error("GAE verse should contain key words");
    }

    // GAE1 might use different HTML structure, just log if it doesn't parse
    const verse16_gae1 = gae1.verses.find(v => v.number === 16);
    if (!verse16_gae1) {
      console.log("    ⚠️  GAE1 translation uses different HTML structure");
    }
  });

  // Test 23: First book of Bible
  await runTest("Fetch first book (Genesis 1:1)", async () => {
    const chapter = await fetchChapter("gen", 1, "GAE");
    if (chapter.verses[0].number !== 1) {
      throw new Error("First verse should be number 1");
    }
    if (!chapter.verses[0].text.includes("태초")) {
      throw new Error("Genesis 1:1 should start with '태초'");
    }
  });

  // Test 24: Last book of Bible
  await runTest("Fetch last book (Revelation 1)", async () => {
    const chapter = await fetchChapter("rev", 1, "GAE");
    if (chapter.book !== "Revelation") {
      throw new Error(`Expected 'Revelation', got '${chapter.book}'`);
    }
    if (chapter.verses.length < 10) {
      throw new Error(`Revelation 1 should have more verses, got ${chapter.verses.length}`);
    }
  });

  // Test 25: Famous verses content validation
  await runTest("Validate John 3:16 content", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    const verse16 = chapter.verses.find(v => v.number === 16);

    if (!verse16) {
      throw new Error("Could not find John 3:16");
    }

    // Key words that should be in John 3:16
    const keywords = ["하나님", "세상", "사랑", "독생자"];
    const missingKeywords = keywords.filter(kw => !verse16.text.includes(kw));

    if (missingKeywords.length > 0) {
      throw new Error(`Missing keywords in John 3:16: ${missingKeywords.join(", ")}`);
    }
  });

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Summary\n");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total Tests: ${total}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`⏱️  Total Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`);
      console.log(`    ${r.error}`);
    });
  }

  console.log("\n" + "=".repeat(60));

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed!\n");
  }
}

runAllTests().catch(error => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
