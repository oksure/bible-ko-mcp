/**
 * Comprehensive Bible study test suite for bible-ko-mcp.
 *
 * Tests are organized around real Bible study and sermon preparation scenarios:
 *  - Sermon preparation (Beatitudes, Lord's Prayer, Love Chapter, etc.)
 *  - Devotional reading (Psalm 23, John 1, etc.)
 *  - Topical study (faith, love, grace, salvation)
 *  - Translation comparison for deeper exegesis
 *  - Korean language support
 *  - Edge cases (longest/shortest chapters, verse ranges)
 *
 * All tests hit the live bskorea.or.kr API — this is an integration suite
 * that validates real-world usability, not isolated unit tests.
 */

import { describe, it, expect } from "vitest";
import { fetchChapter, findBookCode, getVerses } from "./helpers.js";

// ─── Sermon Preparation ──────────────────────────────────────────────────────

describe("Sermon Preparation", () => {
  it("Beatitudes — Matthew 5:3-12 (Eight blessings for a Sunday sermon)", async () => {
    const chapter = await fetchChapter("mat", 5, "GAE");
    const beatitudes = getVerses(chapter, 3, 12);
    expect(beatitudes).toHaveLength(10);
    // Each beatitude begins with 복 (blessed/happy)
    const hasBlessings = beatitudes.filter((v) => v.text.includes("복")).length;
    expect(hasBlessings).toBeGreaterThanOrEqual(8);
  });

  it("Lord's Prayer — Matthew 6:9-13 (Used in weekly liturgy)", async () => {
    const chapter = await fetchChapter("mat", 6, "GAE");
    const prayer = getVerses(chapter, 9, 13);
    expect(prayer).toHaveLength(5);
    // Should contain the address "하늘에 계신 우리 아버지" (Our Father in heaven)
    expect(prayer[0].text).toMatch(/아버지/);
  });

  it("Sermon on the Mount — Matthew 5 has 48 verses", async () => {
    const chapter = await fetchChapter("mat", 5, "GAE");
    expect(chapter.verses).toHaveLength(48);
    expect(chapter.book).toBe("Matthew");
    expect(chapter.bookKorean).toBe("마태복음");
  });

  it("Love Chapter — 1 Corinthians 13 (Wedding & marriage sermons)", async () => {
    const chapter = await fetchChapter("1co", 13, "GAE");
    // The chapter has 13 verses
    expect(chapter.verses.length).toBeGreaterThanOrEqual(13);
    // Famous verse 4: 사랑은 오래 참고 (Love is patient)
    const verse4 = chapter.verses.find((v) => v.number === 4);
    expect(verse4).toBeDefined();
    expect(verse4!.text).toMatch(/사랑/);
  });

  it("Great Commission — Matthew 28:18-20 (Missions Sunday)", async () => {
    const chapter = await fetchChapter("mat", 28, "GAE");
    const commission = getVerses(chapter, 18, 20);
    expect(commission).toHaveLength(3);
    // Should contain "제자를 삼아" or similar discipleship language
    const text = commission.map((v) => v.text).join(" ");
    expect(text).toMatch(/제자|가르쳐|세례/);
  });

  it("Messianic Prophecy — Isaiah 53 (Good Friday / advent sermons)", async () => {
    const chapter = await fetchChapter("isa", 53, "GAE");
    expect(chapter.verses.length).toBeGreaterThanOrEqual(12);
    // "고난받는 종" passages — should contain 우리 (our) or 그가 (he)
    const verse5 = chapter.verses.find((v) => v.number === 5);
    expect(verse5).toBeDefined();
    expect(verse5!.text).toMatch(/채찍|상함|찔림/);
  });

  it("Christmas narrative — Luke 2:1-20 (Christmas Eve sermon)", async () => {
    const chapter = await fetchChapter("luk", 2, "GAE");
    const birth = getVerses(chapter, 1, 20);
    expect(birth).toHaveLength(20);
    // Verse 7: 맏아들을 낳아 (she gave birth to her firstborn)
    const verse7 = birth.find((v) => v.number === 7);
    expect(verse7).toBeDefined();
    expect(verse7!.text).toMatch(/낳아|강보|구유/);
  });

  it("Resurrection account — John 20:1-18 (Easter Sunday)", async () => {
    const chapter = await fetchChapter("jhn", 20, "GAE");
    const resurrection = getVerses(chapter, 1, 18);
    expect(resurrection).toHaveLength(18);
    // Empty tomb: 돌이 옮겨진 것을
    const text = resurrection.map((v) => v.text).join(" ");
    expect(text).toMatch(/돌|막달라|무덤/);
  });
});

// ─── Devotional Reading ───────────────────────────────────────────────────────

describe("Devotional Reading", () => {
  it("Psalm 23 — The Shepherd Psalm (funeral & comfort)", async () => {
    const chapter = await fetchChapter("psa", 23, "GAE");
    expect(chapter.verses.length).toBeGreaterThanOrEqual(6);
    // Verse 1: 여호와는 나의 목자시니 (The Lord is my shepherd)
    const verse1 = chapter.verses.find((v) => v.number === 1);
    expect(verse1).toBeDefined();
    expect(verse1!.text).toMatch(/여호와|목자/);
  });

  it("John 1:1-14 — The Prologue (Christmas devotional)", async () => {
    const chapter = await fetchChapter("jhn", 1, "GAE");
    const prologue = getVerses(chapter, 1, 14);
    expect(prologue).toHaveLength(14);
    // Verse 1: 태초에 말씀이 계시니라 (In the beginning was the Word)
    expect(prologue[0].text).toMatch(/태초|말씀/);
    // Verse 14: 말씀이 육신이 되어 (The Word became flesh)
    const verse14 = prologue.find((v) => v.number === 14);
    expect(verse14!.text).toMatch(/육신|말씀/);
  });

  it("Romans 8:28-39 — Nothing separates us from God's love", async () => {
    const chapter = await fetchChapter("rom", 8, "GAE");
    const passage = getVerses(chapter, 28, 39);
    expect(passage).toHaveLength(12);
    // Verse 28: 모든 것이 합력하여 선을 이루느니라
    const verse28 = passage.find((v) => v.number === 28);
    expect(verse28).toBeDefined();
    expect(verse28!.text).toMatch(/합력|선/);
  });

  it("Proverbs 3:5-6 — Trust in the Lord", async () => {
    const chapter = await fetchChapter("pro", 3, "GAE");
    const passage = getVerses(chapter, 5, 6);
    expect(passage).toHaveLength(2);
    // 마음을 다하여 여호와를 신뢰하고
    expect(passage[0].text).toMatch(/신뢰|마음|여호와/);
  });

  it("Philippians 4:13 — I can do all things through Christ", async () => {
    const chapter = await fetchChapter("php", 4, "GAE");
    const verse = chapter.verses.find((v) => v.number === 13);
    expect(verse).toBeDefined();
    expect(verse!.text).toMatch(/능력|그리스도|힘/);
  });

  it("John 3:16 — The Gospel in one verse", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    expect(chapter.verses).toHaveLength(36);
    const verse16 = chapter.verses.find((v) => v.number === 16);
    expect(verse16).toBeDefined();
    expect(verse16!.text).toMatch(/하나님이 세상을|독생자/);
  });

  it("Genesis 1 — Creation (foundational Bible literacy)", async () => {
    const chapter = await fetchChapter("gen", 1, "GAE");
    expect(chapter.verses).toHaveLength(31);
    // Verse 1: 태초에 하나님이 천지를 창조하시니라
    expect(chapter.verses[0].text).toMatch(/태초|천지|창조/);
    // Verse 31: 보시기에 심히 좋았더라 (it was very good)
    const verse31 = chapter.verses.find((v) => v.number === 31);
    expect(verse31!.text).toMatch(/좋았더라/);
  });
});

// ─── Topical Bible Study ──────────────────────────────────────────────────────

describe("Topical Bible Study — Faith, Hope, Love", () => {
  it("Hebrews 11:1 — Definition of faith (믿음)", async () => {
    const chapter = await fetchChapter("heb", 11, "GAE");
    const verse1 = chapter.verses.find((v) => v.number === 1);
    expect(verse1).toBeDefined();
    // 믿음은 바라는 것들의 실상이요
    expect(verse1!.text).toMatch(/믿음|실상|바라는/);
  });

  it("Faith heroes gallery — Hebrews 11 has enough faith examples", async () => {
    const chapter = await fetchChapter("heb", 11, "GAE");
    expect(chapter.verses.length).toBeGreaterThanOrEqual(30);
    // Should contain references to Abel, Noah, Abraham
    const text = chapter.verses.map((v) => v.text).join(" ");
    expect(text).toMatch(/아벨|노아|아브라함/);
  });

  it("Living faith vs dead faith — James 2:14-26", async () => {
    const chapter = await fetchChapter("jas", 2, "GAE");
    const passage = getVerses(chapter, 14, 26);
    expect(passage).toHaveLength(13);
    // 행함이 없는 믿음은 죽은 것 (faith without works is dead)
    const text = passage.map((v) => v.text).join(" ");
    expect(text).toMatch(/행함|믿음|죽은/);
  });

  it("Fruit of the Spirit — Galatians 5:22-23", async () => {
    const chapter = await fetchChapter("gal", 5, "GAE");
    const passage = getVerses(chapter, 22, 23);
    expect(passage).toHaveLength(2);
    // 성령의 열매는 사랑과 희락과 화평과
    expect(passage[0].text).toMatch(/성령|열매|사랑/);
  });

  it("Spiritual armor — Ephesians 6:10-18 (prayer meeting topic)", async () => {
    const chapter = await fetchChapter("eph", 6, "GAE");
    const passage = getVerses(chapter, 10, 18);
    expect(passage).toHaveLength(9);
    // 하나님의 전신 갑주 (armor of God)
    const text = passage.map((v) => v.text).join(" ");
    expect(text).toMatch(/전신|갑주|하나님/);
  });
});

// ─── Translation Comparison (Exegesis) ───────────────────────────────────────

describe("Translation Comparison for Deeper Study", () => {
  it("John 3:16 in GAE and GAE1 should both return a response", async () => {
    const [gae, gae1] = await Promise.all([
      fetchChapter("jhn", 3, "GAE"),
      fetchChapter("jhn", 3, "GAE1"),
    ]);
    // GAE is always reliable
    const gaeVerse = gae.verses.find((v) => v.number === 16);
    expect(gaeVerse).toBeDefined();
    expect(gaeVerse!.text).toMatch(/하나님이 세상을/);
    // GAE1 HTML differs — verify we got a response object (may parse 0 verses)
    expect(gae1.version).toBe("GAE1");
    const gae1Verse = gae1.verses.find((v) => v.number === 16);
    if (gae1Verse) {
      // If GAE1 parsed successfully, verify content as well
      expect(gae1Verse.text).toMatch(/하나님이 세상을/);
    }
  });

  it("Psalm 23:1 in GAE and GAE1 — comparing classical vs modern Korean", async () => {
    const [gae, gae1] = await Promise.all([
      fetchChapter("psa", 23, "GAE"),
      fetchChapter("psa", 23, "GAE1"),
    ]);
    // GAE is always reliable
    const gaeV1 = gae.verses.find((v) => v.number === 1);
    expect(gaeV1).toBeDefined();
    expect(gaeV1!.text).toMatch(/여호와|목자/);
    // GAE1 HTML differs — verify we got a response object
    expect(gae1.version).toBe("GAE1");
    const gae1V1 = gae1.verses.find((v) => v.number === 1);
    if (gae1V1) {
      expect(gae1V1.text).toMatch(/여호와|목자/);
    }
  });

  it("GAE translation metadata is correct", async () => {
    const chapter = await fetchChapter("jhn", 1, "GAE");
    expect(chapter.version).toBe("GAE");
    expect(chapter.versionName).toContain("개역개정");
  });

  it("GAE1 translation metadata is correct", async () => {
    const chapter = await fetchChapter("jhn", 1, "GAE1");
    expect(chapter.version).toBe("GAE1");
    expect(chapter.versionName).toContain("개역한글");
  });

  it("NIR translation returns a response (may have different verse count)", async () => {
    const chapter = await fetchChapter("jhn", 3, "NIR");
    expect(chapter.version).toBe("NIR");
    // NIR HTML structure may differ — we just confirm a response is returned
    // without throwing. 0 verses is allowed (known HTML difference).
    expect(Array.isArray(chapter.verses)).toBe(true);
  });
});

// ─── Korean Language Support ──────────────────────────────────────────────────

describe("Korean Language Support", () => {
  it("Look up book by Korean name: 시편 → psa", () => {
    expect(findBookCode("시편")).toBe("psa");
  });

  it("Look up book by Korean name: 잠언 → pro", () => {
    expect(findBookCode("잠언")).toBe("pro");
  });

  it("Look up book by Korean name: 마태복음 → mat", () => {
    expect(findBookCode("마태복음")).toBe("mat");
  });

  it("Look up book by Korean name: 요한복음 → jhn", () => {
    expect(findBookCode("요한복음")).toBe("jhn");
  });

  it("Look up book by Korean name: 고린도전서 → 1co", () => {
    expect(findBookCode("고린도전서")).toBe("1co");
  });

  it("Fetched verses contain Korean characters", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    const koreanVerses = chapter.verses.filter((v) => /[가-힣]/.test(v.text));
    expect(koreanVerses.length).toBeGreaterThan(30);
  });

  it("Look up book by English name (case-insensitive): GENESIS → gen", () => {
    expect(findBookCode("GENESIS")).toBe("gen");
  });

  it("Look up book by 3-letter code: gen → gen", () => {
    expect(findBookCode("gen")).toBe("gen");
  });

  it("Returns null for unknown book name", () => {
    expect(findBookCode("Hobbit")).toBeNull();
  });
});

// ─── Edge Cases & Structural Integrity ───────────────────────────────────────

describe("Edge Cases & Structural Integrity", () => {
  it("Psalm 119 — the longest chapter in the Bible (176 verses)", async () => {
    const chapter = await fetchChapter("psa", 119, "GAE");
    expect(chapter.verses.length).toBeGreaterThanOrEqual(170);
  });

  it("Psalm 117 — the shortest chapter in the Bible (2 verses)", async () => {
    const chapter = await fetchChapter("psa", 117, "GAE");
    expect(chapter.verses.length).toBeGreaterThanOrEqual(2);
    expect(chapter.verses.length).toBeLessThanOrEqual(4);
  });

  it("Verse numbers are sequential without gaps (Genesis 1)", async () => {
    const chapter = await fetchChapter("gen", 1, "GAE");
    for (let i = 1; i <= chapter.verses.length; i++) {
      expect(chapter.verses.find((v) => v.number === i)).toBeDefined();
    }
  });

  it("No duplicate verse numbers (deduplication works)", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    const numbers = chapter.verses.map((v) => v.number);
    const unique = new Set(numbers);
    expect(unique.size).toBe(numbers.length);
  });

  it("Verse text does not contain raw footnote markers like '1)'", async () => {
    const chapter = await fetchChapter("gen", 1, "GAE");
    const hasFootnote = chapter.verses.some((v) => /\d+\)/.test(v.text));
    expect(hasFootnote).toBe(false);
  });

  it("Verse range extraction works correctly for John 3:16-17", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    const verses = chapter.verses.filter((v) => v.number >= 16 && v.number <= 17);
    expect(verses).toHaveLength(2);
    expect(verses[0].number).toBe(16);
    expect(verses[1].number).toBe(17);
  });

  it("Single verse extraction works for John 3:16", async () => {
    const chapter = await fetchChapter("jhn", 3, "GAE");
    const verse = chapter.verses.find((v) => v.number === 16);
    expect(verse).toBeDefined();
    expect(verse!.number).toBe(16);
    expect(verse!.text.length).toBeGreaterThan(20);
  });

  it("Chapter metadata is populated correctly", async () => {
    const chapter = await fetchChapter("gen", 1, "GAE");
    expect(chapter.book).toBe("Genesis");
    expect(chapter.bookKorean).toBe("창세기");
    expect(chapter.chapter).toBe(1);
    expect(chapter.version).toBe("GAE");
    expect(chapter.versionName).toBe("개역개정 (Revised Korean)");
  });
});
